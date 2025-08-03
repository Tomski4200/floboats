# Deployment Guide

This guide provides detailed information about deploying the FloBoats application to Vercel.

## Overview

The FloBoats application is configured for automatic deployment to Vercel via GitHub integration. Every push to the main branch triggers a new deployment.

## Build Configuration

### vercel-build.sh

The project uses a custom build script that Vercel executes during deployment:

```bash
#!/bin/bash
# Pre-build script for Vercel deployment

echo "Starting Vercel build process..."

# Note: Case-sensitive import handling is done via existing redirect files:
# - Button.tsx redirects to button-component.tsx
# - Input.tsx redirects to input-component.tsx
# These files are already committed to the repository

# Run the actual build
npm run build
```

**Important**: This script previously created lowercase redirect files which caused circular import errors. This functionality has been removed.

### Build Command Configuration

In `vercel.json` or Vercel dashboard:
- Build Command: `bash vercel-build.sh`
- Output Directory: `.next`
- Install Command: `npm install`

## Deployment Monitoring Scripts

### 1. auto-fix-deployment.py

Comprehensive deployment monitoring with error extraction:

```bash
# Deploy and monitor
python3 auto-fix-deployment.py deploy

# Just monitor (no deploy)
python3 auto-fix-deployment.py

# Monitor and auto-fix errors
python3 auto-fix-deployment.py fix
```

Features:
- Monitors deployment status in real-time
- Extracts TypeScript errors from build logs
- Saves errors to `deployment-errors.json`
- Can automatically fix common errors (with `fix` flag)

### 2. deploy-and-check.sh

Simple deployment script with basic monitoring:

```bash
./deploy-and-check.sh
```

What it does:
1. Checks for uncommitted changes
2. Pushes to GitHub
3. Waits 120 seconds
4. Checks deployment status
5. Shows logs if failed

### 3. check-vercel-build.sh

Check status of the latest deployment:

```bash
# Check after 120 seconds (default)
./check-vercel-build.sh

# Check after custom wait time
./check-vercel-build.sh 60
```

### 4. continuous-deploy-fix.sh

Interactive deployment with manual fixes:

```bash
./continuous-deploy-fix.sh
```

Flow:
1. Deploy code
2. Monitor build
3. Show errors (if any)
4. Wait for you to fix
5. Auto-commit and redeploy
6. Repeat (max 5 times)

## Common Deployment Errors

### 1. TypeScript Type Errors

**Error**: `Type 'X' is not assignable to type 'Y'`

Common causes and fixes:

#### Missing Component Props
```typescript
// Error: Property 'price' does not exist on type 'Boat'
// Fix: Add to interface
interface Boat {
  // ... existing props
  price?: number
}
```

#### Unsupported Component Props
```typescript
// Error: Type '{ label: string; ... }' is not assignable to type 'InputProps'
// Fix: Remove unsupported props and use proper pattern
// ❌ Wrong
<Input label="Email" />

// ✅ Correct
<div>
  <label>Email</label>
  <Input />
</div>
```

### 2. Next.js Static Generation Errors

**Error**: `useSearchParams() should be wrapped in a suspense boundary`

Fix:
```typescript
import { Suspense } from 'react'

function PageContent() {
  const searchParams = useSearchParams()
  // ... component logic
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PageContent />
    </Suspense>
  )
}
```

**Error**: `Dynamic server usage: Route couldn't be rendered statically because it used cookies`

Fix:
```typescript
export const dynamic = 'force-dynamic'

export default async function Page() {
  const cookieStore = cookies()
  // ... rest of component
}
```

### 3. Import Errors

**Error**: `Circular definition of import alias`

This was caused by the old vercel-build.sh creating files that import from themselves. Now fixed.

**Error**: `Module not found: Can't resolve '@/components/ui/button'`

Fix: Use correct casing
```typescript
// ❌ Wrong
import { Button } from '@/components/ui/button'

// ✅ Correct
import { Button } from '@/components/ui/Button'
```

## Environment Variables

Required for deployment monitoring scripts:

```env
# .env or .env.local
VERCEL_TOKEN=your_vercel_api_token
VERCEL_PROJECT_ID=prj_DU3SwuN5Jx3mTNy4TDCIZMAwakok
VERCEL_PROJECT_NAME=floboats
```

To get these:
1. **VERCEL_TOKEN**: Go to Vercel Dashboard → Settings → Tokens
2. **VERCEL_PROJECT_ID**: Found in Vercel project settings
3. **VERCEL_PROJECT_NAME**: Your project name in Vercel

## Deployment Workflow

### Automatic Deployment (Recommended)

1. Push to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. Monitor deployment:
   ```bash
   python3 auto-fix-deployment.py
   ```

3. If errors occur, check `deployment-errors.json`

### Manual Deployment

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

## Troubleshooting

### Build Fails Locally but Works on Vercel

Possible causes:
- Case-sensitive file system differences
- Missing environment variables locally
- Different Node.js versions

Solution:
```bash
# Match Vercel's environment
npm run build
npm run start
```

### Build Succeeds but Site Shows Errors

Check:
1. Runtime environment variables
2. Database connections
3. API routes responses

### Deployment Stuck or Slow

Possible issues:
1. Large bundle size - check with `npm run analyze`
2. Too many static pages - consider ISR
3. Heavy computations during build

## Best Practices

1. **Always test locally first**:
   ```bash
   npm run build && npm run start
   ```

2. **Check types before deploying**:
   ```bash
   npm run type-check
   ```

3. **Monitor bundle size**:
   ```bash
   npm run analyze
   ```

4. **Use deployment scripts** instead of manual pushes for better error visibility

5. **Keep deployment-errors.json** in .gitignore to avoid committing error logs

## Rollback Procedures

If a deployment fails in production:

1. **Via Vercel Dashboard**:
   - Go to project → Deployments
   - Find last working deployment
   - Click "..." → "Promote to Production"

2. **Via Git**:
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Via Vercel CLI**:
   ```bash
   vercel rollback
   ```

## Performance Optimization

1. **Enable ISR for dynamic pages**:
   ```typescript
   export const revalidate = 3600 // 1 hour
   ```

2. **Optimize images**:
   - Use Next.js Image component
   - Configure image domains in next.config.js

3. **Minimize client-side JavaScript**:
   - Use server components where possible
   - Lazy load heavy components

Remember: The deployment process is designed to catch errors early. Use the monitoring scripts to get detailed error information and fix issues before they reach production.