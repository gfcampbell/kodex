#!/usr/bin/env node

/**
 * Kodex CLI
 * 
 * Automated knowledge base generator for product support.
 */

import { Command } from 'commander';
import { scanCommand } from './commands/scan.js';
import { initCommand } from './commands/init.js';
import { reviewCommand } from './commands/review.js';
import { gapsCommand } from './commands/gaps.js';
import { dashboardCommand } from './commands/dashboard.js';

const program = new Command();

program
  .name('kodex')
  .description('Automated knowledge base generator for product support')
  .version('0.1.0');

// Initialize a new Kodex project
program
  .command('init')
  .description('Initialize Kodex in the current project')
  .option('-f, --force', 'Overwrite existing configuration')
  .action(initCommand);

// Scan the codebase and generate docs
program
  .command('scan')
  .description('Scan codebase and generate documentation')
  .option('-c, --changed', 'Only regenerate docs for changed files')
  .option('--dry-run', 'Show what would be generated without writing')
  .option('--no-generate', 'Only scan, skip doc generation')
  .option('--mock', 'Use mock LLM responses (for testing)')
  .action(scanCommand);

// Review generated docs
program
  .command('review')
  .description('Interactively review generated documentation')
  .option('-s, --status <status>', 'Filter by status (draft|reviewed|approved)')
  .action(reviewCommand);

// Manage the gap queue
program
  .command('gaps')
  .description('View and manage unanswered questions')
  .option('-a, --add <question>', 'Add a new gap')
  .option('--resolve <id>', 'Mark a gap as resolved')
  .action(gapsCommand);

// Start the dashboard
program
  .command('dashboard')
  .description('Start the web dashboard')
  .option('-p, --port <port>', 'Port to run on', '3333')
  .action(dashboardCommand);

program.parse();
