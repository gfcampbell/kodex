/**
 * kodex gaps
 * 
 * View and manage unanswered questions.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import type { GapItem } from '@kodex/shared';

interface GapsOptions {
  add?: string;
  resolve?: string;
}

export async function gapsCommand(options: GapsOptions): Promise<void> {
  const cwd = process.cwd();
  const gapsPath = join(cwd, '.kodex', 'gaps.json');

  if (!existsSync(gapsPath)) {
    console.log(chalk.red('❌ Kodex is not initialized in this project.'));
    console.log(chalk.gray('   Run: kodex init'));
    return;
  }

  // Load gaps
  let gaps: GapItem[];
  try {
    const data = JSON.parse(readFileSync(gapsPath, 'utf-8'));
    gaps = data.gaps || [];
  } catch {
    gaps = [];
  }

  // Add a new gap
  if (options.add) {
    const newGap: GapItem = {
      id: `gap-${Date.now()}`,
      question: options.add,
      askedAt: new Date().toISOString(),
      frequency: 1,
      status: 'pending',
    };
    gaps.push(newGap);
    
    // Save
    const fs = await import('fs');
    fs.writeFileSync(gapsPath, JSON.stringify({ gaps }, null, 2));
    
    console.log(chalk.green(`✅ Added gap: "${options.add}"`));
    return;
  }

  // Resolve a gap
  if (options.resolve) {
    const gap = gaps.find(g => g.id === options.resolve);
    if (!gap) {
      console.log(chalk.red(`❌ Gap not found: ${options.resolve}`));
      return;
    }
    gap.status = 'resolved';
    
    // Save
    const fs = await import('fs');
    fs.writeFileSync(gapsPath, JSON.stringify({ gaps }, null, 2));
    
    console.log(chalk.green(`✅ Resolved: ${gap.question}`));
    return;
  }

  // List gaps
  if (gaps.length === 0) {
    console.log(chalk.green('✅ No unanswered questions'));
    return;
  }

  console.log(chalk.bold(`\n📋 Unanswered Questions (${gaps.length})\n`));
  
  const pending = gaps.filter(g => g.status === 'pending');
  const inProgress = gaps.filter(g => g.status === 'in-progress');
  
  if (pending.length > 0) {
    console.log(chalk.yellow('Pending:'));
    pending.forEach(gap => {
      console.log(chalk.gray(`  [${gap.id}] ${gap.question}`));
      if (gap.frequency > 1) {
        console.log(chalk.gray(`           Asked ${gap.frequency} times`));
      }
    });
    console.log('');
  }
  
  if (inProgress.length > 0) {
    console.log(chalk.blue('In Progress:'));
    inProgress.forEach(gap => {
      console.log(chalk.gray(`  [${gap.id}] ${gap.question}`));
      if (gap.assignee) {
        console.log(chalk.gray(`           Assigned to: ${gap.assignee}`));
      }
    });
  }
}
