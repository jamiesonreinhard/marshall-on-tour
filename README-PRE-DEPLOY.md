# Pre-Deploy Checklist

## Before Pushing to Vercel

Run these checks to catch errors early:

```bash
# Quick check (type-check + lint, no build)
npm run pre-build:skip-build

# Full check (type-check + lint + build)
npm run pre-build
```

## What Gets Checked

✅ **TypeScript** - All types are correct  
✅ **ESLint** - Code quality and style  
✅ **Next.js Build** - Project actually builds  

## Quick Commands

```bash
# Just type check
npm run type-check

# Just lint
npm run lint

# Fix linting automatically
npm run lint:fix

# Full check before deploy
npm run pre-build
```

## If Checks Fail

1. **Type errors** → Fix TypeScript issues
2. **Lint errors** → Run `npm run lint:fix` or fix manually
3. **Build errors** → Check missing env vars, imports, dependencies

## GitHub Actions

Checks run automatically on PRs - no need to wait for Vercel to catch errors!
