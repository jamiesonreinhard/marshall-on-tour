#!/usr/bin/env tsx
/**
 * Pre-Build Check Script
 * 
 * Runs before deployment to catch errors:
 * - TypeScript type checking
 * - ESLint checks
 * - Build verification
 * 
 * Usage:
 *   npm run pre-build
 *   npm run check
 *   npm run check:all
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command: string, description: string): boolean {
  log(`\n${'='.repeat(80)}`, 'cyan');
  log(`🔍 ${description}`, 'cyan');
  log('='.repeat(80), 'cyan');
  
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    log(`✅ ${description} passed`, 'green');
    return true;
  } catch (error: any) {
    log(`❌ ${description} failed`, 'red');
    if (error.stdout) {
      console.error(error.stdout.toString());
    }
    if (error.stderr) {
      console.error(error.stderr.toString());
    }
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const skipBuild = args.includes('--skip-build');
  const ci = args.includes('--ci');
  
  log('\n🚀 Pre-Build Check Starting...', 'blue');
  log(`Working directory: ${process.cwd()}`, 'blue');
  
  const checks: Array<{ command: string; description: string }> = [
    {
      command: 'npx tsc --noEmit',
      description: 'TypeScript Type Checking',
    },
    {
      command: ci 
        ? 'npx eslint . --ext .ts,.tsx --max-warnings 0'
        : 'npx eslint . --ext .ts,.tsx',
      description: 'ESLint Code Quality Check',
    },
  ];
  
  if (!skipBuild) {
    checks.push({
      command: 'npm run build',
      description: 'Next.js Build Verification',
    });
  }
  
  const results: boolean[] = [];
  
  for (const check of checks) {
    const passed = runCommand(check.command, check.description);
    results.push(passed);
    
    if (!passed) {
      log(`\n❌ Pre-build check failed at: ${check.description}`, 'red');
      log('Fix the errors above before deploying.', 'yellow');
      process.exit(1);
    }
  }
  
  // Summary
  log(`\n${'='.repeat(80)}`, 'green');
  log('✅ All Pre-Build Checks Passed!', 'green');
  log('='.repeat(80), 'green');
  log(`\nChecked: ${results.length} items`, 'green');
  log('Ready to deploy to Vercel 🚀\n', 'green');
  
  process.exit(0);
}

main().catch((error) => {
  log(`\n❌ Pre-build check script error: ${error.message}`, 'red');
  process.exit(1);
});
