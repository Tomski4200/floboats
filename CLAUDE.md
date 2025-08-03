# CLAUDE.md - AI Assistant Context

This file provides essential context for AI assistants working on the FloBoats project.

## Project Overview

FloBoats is a Next.js 15 application for boat marketplace and marine community features:
- Boat listings and marketplace
- Business directory with reviews
- Events calendar and management
- Community forums
- Direct messaging between users

**Tech Stack**: Next.js 15, TypeScript (strict mode), Supabase, Tailwind CSS

## Critical Information

### Component Restrictions

**Button Component** - Only supports these props:
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' (NO 'destructive')
- `size`: 'sm' | 'md' | 'lg' | 'icon'
- `disabled`, `onClick`, `type`, `className`, `children`
- NO `asChild` prop - wrap in anchor tags instead
- NO `label` prop

**Input Component** - Standard HTML input wrapper:
- NO `label` or `helper` props
- Use separate `<label>` elements
- See DEVELOPMENT.md for patterns

### Import Requirements

**ALWAYS use capitalized imports:**
```typescript
✅ import { Button } from '@/components/ui/Button'
❌ import { Button } from '@/components/ui/button'
```

### Next.js 15 Patterns

**useSearchParams requires Suspense:**
```typescript
function ContentComponent() {
  const searchParams = useSearchParams()
  // component logic
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContentComponent />
    </Suspense>
  )
}
```

**Pages using cookies() need dynamic export:**
```typescript
export const dynamic = 'force-dynamic'
```

## Common Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run type-check            # Check TypeScript types only
npm run lint                  # Run ESLint

# Testing before deployment
npm run build && npm run start # Test production build locally

# Deployment monitoring
python3 auto-fix-deployment.py # Monitor Vercel deployment
git status                     # Check for uncommitted changes

# Database
npm run db:migrate            # Run Supabase migrations
npm run db:seed               # Seed database
```

## Important Patterns

### Form Fields
```tsx
// Always use this pattern for form inputs:
<div>
  <label htmlFor="fieldId" className="block text-sm font-medium text-gray-700 mb-1">
    Label Text
  </label>
  <Input id="fieldId" type="text" value={value} onChange={handler} />
  <p className="mt-1 text-sm text-gray-500">Helper text</p>
</div>
```

### Supabase Array Handling
```typescript
// Supabase joins may return arrays
const category = Array.isArray(event.category) ? event.category[0] : event.category
```

### Error Pages
- Use `notFound()` from next/navigation for 404s
- Always check for null/undefined before using data

## Do's and Don'ts

### DO:
- ✅ Run `npm run build` before pushing code
- ✅ Use proper TypeScript types for all props and returns
- ✅ Handle loading and error states
- ✅ Test with production build locally
- ✅ Check deployment-errors.json after failed deploys
- ✅ Use existing UI components from /components/ui
- ✅ Follow existing code patterns in the codebase

### DON'T:
- ❌ Create lowercase redirect files (causes circular imports)
- ❌ Add unsupported props to UI components
- ❌ Use `variant="destructive"` on Button
- ❌ Import from lowercase paths
- ❌ Forget Suspense boundaries with useSearchParams
- ❌ Skip type checking before deployment
- ❌ Modify vercel-build.sh without understanding implications

## Known Issues & Solutions

1. **"Circular definition of import alias"**
   - Already fixed in vercel-build.sh
   - Don't create new lowercase redirect files

2. **"Type '{ label: string; }' is not assignable..."**
   - Input/Button don't support label props
   - Use separate label elements

3. **"useSearchParams() should be wrapped in suspense"**
   - Wrap component in Suspense (see pattern above)

4. **"Dynamic server usage" error**
   - Add `export const dynamic = 'force-dynamic'`

5. **Case-sensitive import errors on Vercel**
   - Use exact casing: Button not button

## Project Structure

```
/app              # Next.js 15 app router pages
/components/ui    # Reusable UI components (Button, Input, etc.)
/lib             # Utilities and configurations
/hooks           # Custom React hooks
/supabase        # Database migrations and seed files
/public          # Static assets
```

## Testing Requirements

Before pushing code:
1. Run `npm run build` - must succeed
2. Run `npm run type-check` - no errors
3. Test critical paths in production mode
4. Check for console errors in browser
5. Verify responsive design

## Deployment Process

1. Code is pushed to GitHub main branch
2. Vercel automatically deploys via GitHub integration
3. Monitor with: `python3 auto-fix-deployment.py`
4. Check deployment-errors.json if build fails
5. Production URL: https://floboats.vercel.app

## Environment Variables

Required in .env.local:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (server-side only)
- NEXT_PUBLIC_SITE_URL (optional - set to https://floboats.com in production)

For deployment monitoring:
- VERCEL_TOKEN
- VERCEL_PROJECT_ID
- VERCEL_PROJECT_NAME

## Getting Help

- See DEVELOPMENT.md for detailed patterns
- See DEPLOYMENT_GUIDE.md for deployment help
- Check project/notes/A*.md for implementation details
- Review recent commits for examples

## Recent Important Changes

- Fixed circular imports in build process
- Standardized component prop interfaces
- Added Suspense requirements for Next.js 15
- Updated all imports to use correct casing

Remember: This is a production application. Always test thoroughly and follow existing patterns!