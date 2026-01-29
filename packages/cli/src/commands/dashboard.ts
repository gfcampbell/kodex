/**
 * kodex dashboard
 * 
 * Start the web dashboard for reviewing documentation.
 */

import { spawn } from 'child_process';
import { resolve } from 'path';
import chalk from 'chalk';

interface DashboardOptions {
  port?: string;
}

export async function dashboardCommand(options: DashboardOptions): Promise<void> {
  const port = options.port || '3333';
  const cwd = process.cwd();
  
  // Find the dashboard package directory
  // First try to resolve from @kodex/dashboard package
  let dashboardDir: string;
  try {
    const dashboardPkg = require.resolve('@kodex/dashboard/package.json');
    dashboardDir = resolve(dashboardPkg, '..');
  } catch {
    // Fallback: assume monorepo structure
    // From workspace root, go to packages/dashboard
    dashboardDir = resolve(cwd, 'packages', 'dashboard');
  }
  
  console.log(chalk.blue('Starting Kodex Dashboard...'));
  console.log(chalk.gray(`   Port: ${port}`));
  console.log(chalk.gray(`   Project: ${cwd}`));
  console.log('');
  
  // Set environment variables
  const env = {
    ...process.env,
    PORT: port,
    KODEX_PROJECT_PATH: cwd,
  };

  try {
    // Try to start the Next.js dev server
    const child = spawn('npm', ['run', 'dev'], {
      cwd: dashboardDir,
      env,
      stdio: 'inherit',
      shell: true,
    });

    child.on('error', (error) => {
      console.error(chalk.red('Failed to start dashboard:'), error.message);
      console.log('');
      console.log(chalk.yellow('Make sure you have installed dependencies:'));
      console.log(chalk.gray('   cd packages/dashboard && pnpm install'));
    });

    child.on('close', (code) => {
      if (code !== 0 && code !== null) {
        console.log(chalk.yellow(`Dashboard exited with code ${code}`));
      }
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      child.kill('SIGINT');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      child.kill('SIGTERM');
      process.exit(0);
    });

    // Wait for the process to exit
    await new Promise<void>((resolve) => {
      child.on('close', () => resolve());
    });

  } catch (error) {
    console.error(chalk.red('Failed to start dashboard'));
    console.log('');
    console.log(chalk.yellow('To start the dashboard manually:'));
    console.log(chalk.gray(`   cd packages/dashboard`));
    console.log(chalk.gray(`   pnpm install`));
    console.log(chalk.gray(`   pnpm dev`));
  }
}
