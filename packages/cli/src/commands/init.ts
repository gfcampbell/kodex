/**
 * kodex init
 * 
 * Initialize Kodex in the current project.
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import type { KodexConfig } from '@kodex/shared';

interface InitOptions {
  force?: boolean;
}

const DEFAULT_CONFIG: KodexConfig = {
  name: 'My Product',
  version: '1.0.0',
  scan: {
    include: ['src/**/*.{ts,tsx,js,jsx}'],
    exclude: [
      '**/*.test.*',
      '**/*.spec.*',
      '**/node_modules/**',
      '**/__tests__/**',
      '**/__mocks__/**',
    ],
    framework: 'auto',
  },
  docs: {
    outputDir: '.kodex/docs',
    format: 'both',
    topics: [
      'authentication',
      'navigation',
      'data',
      'settings',
      'errors',
    ],
  },
  llm: {
    provider: 'anthropic',
    model: 'claude-3-5-haiku-20241022',
  },
  dashboard: {
    port: 3333,
    auth: false,
  },
};

function generateConfigYaml(config: KodexConfig): string {
  return `# Kodex Configuration
# Documentation: https://github.com/phasefour/kodex

# Project info
name: "${config.name}"
version: "${config.version}"

# What to scan
scan:
  include:
${config.scan.include.map(p => `    - "${p}"`).join('\n')}
  exclude:
${config.scan.exclude.map(p => `    - "${p}"`).join('\n')}
  
  # Framework hint (react | nextjs | express | auto)
  framework: ${config.scan.framework}

# Documentation settings
docs:
  outputDir: "${config.docs.outputDir}"
  format: ${config.docs.format}
  
  # Common topics to generate (see docs/COMMON-TOPICS.md)
  topics:
${config.docs.topics.map(t => `    - ${t}`).join('\n')}

# LLM settings
llm:
  provider: ${config.llm.provider}
  model: ${config.llm.model}
  # apiKey: \${ANTHROPIC_API_KEY}  # Uses env var by default

# Dashboard settings (optional)
dashboard:
  port: ${config.dashboard?.port}
  auth: ${config.dashboard?.auth}
`;
}

export async function initCommand(options: InitOptions): Promise<void> {
  const cwd = process.cwd();
  const configPath = join(cwd, 'kodex.config.yaml');
  const kodexDir = join(cwd, '.kodex');

  // Check if already initialized
  if (existsSync(configPath) && !options.force) {
    console.log(chalk.yellow('⚠️  Kodex is already initialized in this project.'));
    console.log(chalk.gray('   Use --force to overwrite existing configuration.'));
    return;
  }

  // Create .kodex directory
  if (!existsSync(kodexDir)) {
    mkdirSync(kodexDir, { recursive: true });
    mkdirSync(join(kodexDir, 'docs'), { recursive: true });
  }

  // Detect project type
  const packageJsonPath = join(cwd, 'package.json');
  let projectName = 'My Product';
  let detectedFramework: KodexConfig['scan']['framework'] = 'auto';

  if (existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(require('fs').readFileSync(packageJsonPath, 'utf-8'));
      projectName = pkg.name || projectName;
      
      // Detect framework
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps['next']) {
        detectedFramework = 'nextjs';
      } else if (deps['react']) {
        detectedFramework = 'react';
      } else if (deps['express']) {
        detectedFramework = 'express';
      }
    } catch {
      // Ignore errors reading package.json
    }
  }

  // Generate config
  const config: KodexConfig = {
    ...DEFAULT_CONFIG,
    name: projectName,
    scan: {
      ...DEFAULT_CONFIG.scan,
      framework: detectedFramework,
    },
  };

  // Write config file
  writeFileSync(configPath, generateConfigYaml(config));

  // Write initial items.json
  writeFileSync(
    join(kodexDir, 'items.json'),
    JSON.stringify({ items: [], meta: { name: projectName, version: '1.0.0' } }, null, 2)
  );

  // Write initial gaps.json
  writeFileSync(
    join(kodexDir, 'gaps.json'),
    JSON.stringify({ gaps: [] }, null, 2)
  );

  // Add .kodex to .gitignore if needed
  const gitignorePath = join(cwd, '.gitignore');
  if (existsSync(gitignorePath)) {
    const gitignore = require('fs').readFileSync(gitignorePath, 'utf-8');
    if (!gitignore.includes('.kodex')) {
      require('fs').appendFileSync(gitignorePath, '\n# Kodex\n.kodex/\n');
      console.log(chalk.gray('   Added .kodex/ to .gitignore'));
    }
  }

  console.log(chalk.green('✅ Kodex initialized successfully!'));
  console.log('');
  console.log(chalk.gray('   Created:'));
  console.log(chalk.gray(`   - ${configPath}`));
  console.log(chalk.gray(`   - ${kodexDir}/`));
  
  if (detectedFramework !== 'auto') {
    console.log('');
    console.log(chalk.blue(`   Detected framework: ${detectedFramework}`));
  }

  console.log('');
  console.log(chalk.gray('   Next steps:'));
  console.log(chalk.gray('   1. Edit kodex.config.yaml to customize settings'));
  console.log(chalk.gray('   2. Set ANTHROPIC_API_KEY (or configure another provider)'));
  console.log(chalk.gray('   3. Run: kodex scan'));
}
