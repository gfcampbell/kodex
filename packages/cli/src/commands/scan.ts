/**
 * kodex scan
 * 
 * Scan the codebase and generate documentation.
 */

import { existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { loadConfig } from '../config.js';
import { scanCodebase } from '../scanner/index.js';
import { generateDocs } from '../generator/index.js';
import { saveKnowledgeBase, loadKnowledgeBase } from '../storage/index.js';
import type { CodeMap, KnowledgeBase } from '@kodex/shared';

interface ScanOptions {
  changed?: boolean;
  dryRun?: boolean;
  generate?: boolean;
  mock?: boolean;
}

export async function scanCommand(options: ScanOptions): Promise<void> {
  const cwd = process.cwd();
  const configPath = join(cwd, 'kodex.config.yaml');

  // Check if initialized
  if (!existsSync(configPath)) {
    console.log(chalk.red('❌ Kodex is not initialized in this project.'));
    console.log(chalk.gray('   Run: kodex init'));
    return;
  }

  // Load configuration
  const spinner = ora('Loading configuration...').start();
  let config;
  
  try {
    config = await loadConfig(cwd);
    spinner.succeed('Configuration loaded');
  } catch (error) {
    spinner.fail('Failed to load configuration');
    console.error(chalk.red(`   ${error}`));
    return;
  }

  // Load existing knowledge base
  let kb: KnowledgeBase;
  try {
    kb = await loadKnowledgeBase(cwd);
  } catch {
    kb = {
      items: [],
      gaps: [],
      meta: { name: config.name, version: config.version },
    };
  }

  // Phase 1: Scan codebase
  spinner.start('Scanning codebase...');
  let codeMap: CodeMap;
  
  try {
    codeMap = await scanCodebase(cwd, config.scan);
    spinner.succeed(
      `Scanned ${codeMap.meta.filesScanned} files in ${codeMap.meta.scanDurationMs}ms`
    );
    
    console.log(chalk.gray(`   Routes: ${codeMap.routes.length}`));
    console.log(chalk.gray(`   Components: ${codeMap.components.length}`));
    console.log(chalk.gray(`   Pages: ${codeMap.pages.length}`));
    console.log(chalk.gray(`   Features: ${codeMap.features.length}`));
    
    if (codeMap.meta.framework) {
      console.log(chalk.blue(`   Framework: ${codeMap.meta.framework}`));
    }
  } catch (error) {
    spinner.fail('Failed to scan codebase');
    console.error(chalk.red(`   ${error}`));
    return;
  }

  // Store code map in KB
  kb.codeMap = codeMap;

  // Skip generation if --no-generate
  if (options.generate === false) {
    await saveKnowledgeBase(cwd, kb);
    console.log(chalk.green('\n✅ Scan complete (generation skipped)'));
    return;
  }

  // Phase 2: Generate documentation
  spinner.start('Generating documentation...');
  
  try {
    const result = await generateDocs(codeMap, config, kb, {
      changedOnly: options.changed,
      dryRun: options.dryRun,
      mock: options.mock,
    });
    
    spinner.succeed('Documentation generated');
    
    console.log(chalk.gray(`   Generated: ${result.generated} items`));
    console.log(chalk.gray(`   Updated: ${result.updated} items`));
    console.log(chalk.gray(`   Skipped: ${result.skipped} items (pinned or unchanged)`));
    
    if (result.tokensUsed) {
      console.log(chalk.gray(`   Tokens used: ${result.tokensUsed.toLocaleString()}`));
    }

    // Update KB with new items
    kb.items = result.items;
    kb.meta.lastScanAt = new Date().toISOString();
    kb.meta.lastGenerateAt = new Date().toISOString();

    // Save unless dry run
    if (!options.dryRun) {
      await saveKnowledgeBase(cwd, kb);
      console.log(chalk.green(`\n✅ Knowledge base saved to ${config.docs.outputDir}`));
    } else {
      console.log(chalk.yellow('\n⚠️  Dry run - no files written'));
    }

    // Report on items needing review
    const drafts = kb.items.filter(i => i.status === 'draft');
    if (drafts.length > 0) {
      console.log(chalk.yellow(`\n📝 ${drafts.length} items need review`));
      console.log(chalk.gray('   Run: kodex review'));
    }

  } catch (error) {
    spinner.fail('Failed to generate documentation');
    console.error(chalk.red(`   ${error}`));
    return;
  }
}
