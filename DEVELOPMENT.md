# Development Guide

This guide covers important patterns and requirements for developing the FloBoats application.

## UI Component Usage

### Button Component

The Button component has specific prop restrictions. Only the following props are supported:

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
  disabled?: boolean
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  children: React.ReactNode
}
```

**Important**: The Button component does NOT support:
- `asChild` prop (use anchor wrapping instead)
- `label` prop (use separate label elements)
- `variant="destructive"` (use `variant="secondary"` with red className)

#### Correct Usage Examples:

```tsx
// Basic button
<Button variant="primary" onClick={handleClick}>
  Click me
</Button>

// Button as link - wrap with anchor
<Link href="/path">
  <Button variant="outline">
    Go to page
  </Button>
</Link>

// Destructive style button
<Button 
  variant="secondary" 
  className="bg-red-500 hover:bg-red-600 text-white"
  onClick={handleDelete}
>
  Delete
</Button>
```

### Input Component

The Input component is a simple wrapper around the HTML input element and does NOT support label or helper text props.

**Correct Usage**:

```tsx
// With label and helper text
<div>
  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
    Email address
  </label>
  <Input
    id="email"
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="Enter your email"
  />
  <p className="mt-1 text-sm text-gray-500">We'll never share your email.</p>
</div>
```

### Import Patterns

Always import UI components from the capitalized paths:

```tsx
// ✅ Correct
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/card'

// ❌ Incorrect
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
```

## Next.js 15 Requirements

### useSearchParams() and Suspense Boundaries

In Next.js 15, any component using `useSearchParams()` must be wrapped in a Suspense boundary to handle the asynchronous nature of search params.

**Pattern**:

```tsx
'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

// Inner component that uses useSearchParams
function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q')
  
  return <div>Search query: {query}</div>
}

// Main component wrapped in Suspense
export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchContent />
    </Suspense>
  )
}
```

### Dynamic Rendering

Pages that use server-side features like `cookies()` must be marked as dynamic to prevent static generation errors:

```tsx
import { cookies } from 'next/headers'

// Add this export to force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const cookieStore = cookies()
  // ... rest of your component
}
```

## Case-Sensitive Imports

### Background

Vercel deployments run on Linux systems which are case-sensitive, while local development on Windows/Mac may be case-insensitive. This can cause deployment failures.

### Our Solution

We use a redirect pattern for components that might have case conflicts:

```
components/ui/
  ├── Button.tsx         # Redirect file
  ├── button-component.tsx  # Actual component
  ├── Input.tsx          # Redirect file
  └── input-component.tsx   # Actual component
```

The redirect files (Button.tsx, Input.tsx) simply re-export from the actual implementation:

```tsx
// Button.tsx
export { Button, type ButtonProps } from './button-component'
```

### Build Process

The `vercel-build.sh` script handles the build process but does NOT create lowercase redirect files (this caused circular import issues). The script now simply runs the Next.js build:

```bash
#!/bin/bash
# Pre-build script for Vercel deployment

echo "Starting Vercel build process..."

# Note: Case-sensitive import handling is done via existing redirect files:
# - Button.tsx redirects to button-component.tsx
# - Input.tsx redirects to input-component.tsx

# Run the actual build
npm run build
```

## Common Patterns

### Form Fields with Labels

Always structure form fields with proper labels for accessibility:

```tsx
<div className="space-y-4">
  <div>
    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
      Name
    </label>
    <Input
      id="name"
      type="text"
      value={name}
      onChange={(e) => setName(e.target.value)}
      required
    />
  </div>
</div>
```

### Error Handling in Client Components

When using hooks like `useSearchParams()` in error-prone scenarios:

```tsx
function SafeSearchComponent() {
  try {
    const searchParams = useSearchParams()
    // ... use searchParams
  } catch (error) {
    console.error('Search params error:', error)
    return <div>Error loading search parameters</div>
  }
}
```

## TypeScript Strict Mode

The project uses TypeScript in strict mode. Common issues and solutions:

1. **Nullable values**: Always check for null/undefined
   ```tsx
   // ✅ Good
   if (user?.email) {
     // use email
   }
   ```

2. **Array responses from Supabase**: Handle potential array returns
   ```tsx
   // Supabase joins might return arrays
   const category = Array.isArray(event.category) ? event.category[0] : event.category
   ```

3. **Event handler types**: Always type event handlers
   ```tsx
   onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
   ```

## Testing Components Locally

Before deployment, always test:

1. **Case-sensitive imports**: Try building locally with `npm run build`
2. **Dynamic pages**: Test with production build `npm run build && npm run start`
3. **Search params**: Test URLs with query parameters
4. **Authentication flows**: Test with real Supabase auth

## Debugging Tips

1. **Build errors**: Check `deployment-errors.json` after failed deployments
2. **Import errors**: Verify file casing matches exactly
3. **Hydration errors**: Check for client/server mismatches
4. **Type errors**: Run `npm run type-check` locally

Remember: What works locally might not work in production due to environment differences!