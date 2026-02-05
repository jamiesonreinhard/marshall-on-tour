# Pre-Build Checks

## Overview

Pre-build checks catch errors before deploying to Vercel, saving time and preventing broken deployments.

## Available Scripts

### Quick Checks
```bash
# Type check only
npm run type-check

# Lint only
npm run lint

# Fix linting issues automatically
npm run lint:fix
```

### Full Pre-Build Check
```bash
# Run all checks (type-check + lint + build)
npm run pre-build

# Skip build (faster, just type-check + lint)
npm run pre-build:skip-build

# CI mode (fails on warnings)
npm run pre-build:ci
```

### Manual Checks
```bash
# Type check + lint (no build)
npm run check

# Everything including build
npm run check:all
```

## What Gets Checked

### 1. TypeScript Type Checking
- Verifies all TypeScript files compile without errors
- Catches type mismatches, missing imports, etc.
- Uses `tsc --noEmit` (doesn't generate files, just checks)

### 2. ESLint Code Quality
- Checks code style and potential bugs
- Uses Next.js ESLint config
- Can auto-fix with `npm run lint:fix`

### 3. Next.js Build Verification
- Actually builds the project
- Catches build-time errors
- Verifies all pages compile
- Can be skipped for faster checks

## When to Run

### Before Every Commit
```bash
npm run pre-build:skip-build  # Fast check
```

### Before Pushing to Main
```bash
npm run pre-build  # Full check including build
```

### In CI/CD
The GitHub Actions workflow runs automatically on PRs and pushes.

## VS Code Integration

Tasks are configured in `.vscode/tasks.json`:
- Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
- Type "Run Task"
- Select "Pre-Build Check"

Or use the keyboard shortcut if configured.

## Common Issues

### Type Errors
```bash
# See all type errors
npm run type-check

# Fix: Update types, add missing imports, fix type mismatches
```

### Lint Errors
```bash
# See all lint errors
npm run lint

# Auto-fix what can be fixed
npm run lint:fix

# Fix remaining issues manually
```

### Build Errors
```bash
# See build errors
npm run build

# Common issues:
# - Missing environment variables
# - Import errors
# - Missing dependencies
```

## GitHub Actions

The workflow (`.github/workflows/pre-deploy-check.yml`) automatically:
- Runs on every PR
- Runs on pushes to main/master
- Checks types, linting, and build
- Fails the PR if any check fails

## Tips

1. **Run checks often** - Catch errors early
2. **Use `--skip-build` for speed** - When you just want quick feedback
3. **Fix linting automatically** - `npm run lint:fix` handles most issues
4. **Check before pushing** - Save yourself from broken deployments

## Integration with Git

You can add a pre-push hook (optional):
```bash
# Install husky (if you want)
npm install --save-dev husky

# Add pre-push hook
npx husky add .husky/pre-push "npm run pre-build:skip-build"
```

Or just run manually before pushing:
```bash
npm run pre-build && git push
```
