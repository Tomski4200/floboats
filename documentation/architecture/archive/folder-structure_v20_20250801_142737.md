# FloBoats Folder Structure
*Created: 2025-01-30 14:30 UTC*  
*Last Updated: 2025-01-30 14:30 UTC*  
*Status: Draft*

## Overview
This document outlines the folder structure for the FloBoats Next.js application, following best practices for App Router and maintaining clear separation of concerns.

## Table of Contents
- [Root Structure](#root-structure)
- [App Directory](#app-directory)
- [Components Organization](#components-organization)
- [Library and Utilities](#library-and-utilities)
- [Type Definitions](#type-definitions)
- [Public Assets](#public-assets)

## Root Structure

```
floboats/
├── app/                    # Next.js App Router
├── components/            # Reusable React components
├── lib/                   # Utilities and configurations
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
├── public/                # Static assets
├── documentation/         # Project documentation
├── tests/                 # Test files
├── .next/                 # Next.js build output (git ignored)
├── node_modules/          # Dependencies (git ignored)
├── ROADMAP.md            # High-level project roadmap
├── CURRENT_SPRINT.md     # Active development tasks
└── [config files]         # .env, next.config.js, etc.
```

## App Directory

Following Next.js 14 App Router conventions:

```
app/
├── (auth)/               # Auth routes group
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   └── reset-password/
│       └── page.tsx
├── (dashboard)/          # Protected routes group
│   ├── dashboard/
│   │   └── page.tsx
│   ├── boats/
│   │   ├── page.tsx      # List boats
│   │   ├── new/
│   │   │   └── page.tsx  # Create boat
│   │   └── [id]/
│   │       ├── page.tsx  # View boat
│   │       └── edit/
│   │           └── page.tsx
│   └── settings/
│       └── page.tsx
├── (public)/             # Public routes group
│   ├── marketplace/
│   ├── directory/
│   ├── events/
│   └── forums/
├── api/                  # API routes
│   ├── auth/
│   ├── boats/
│   ├── listings/
│   └── businesses/
├── layout.tsx            # Root layout
├── page.tsx              # Homepage
├── loading.tsx           # Loading UI
├── error.tsx             # Error UI
└── not-found.tsx         # 404 page
```

## Components Organization

```
components/
├── ui/                   # Base UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   └── Modal.tsx
├── layout/               # Layout components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Sidebar.tsx
│   └── Navigation.tsx
├── features/             # Feature-specific components
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   ├── boats/
│   │   ├── BoatCard.tsx
│   │   ├── BoatForm.tsx
│   │   └── BoatGallery.tsx
│   ├── marketplace/
│   │   ├── ListingCard.tsx
│   │   └── SearchFilters.tsx
│   └── business/
│       ├── BusinessCard.tsx
│       └── ReviewForm.tsx
└── shared/               # Shared components
    ├── LoadingSpinner.tsx
    ├── ErrorBoundary.tsx
    └── SEO.tsx
```

## Library and Utilities

```
lib/
├── supabase/            # Supabase configuration
│   ├── client.ts        # Browser client
│   ├── server.ts        # Server client
│   └── types.ts         # Generated types
├── utils/               # Helper functions
│   ├── format.ts        # Formatters (dates, currency)
│   ├── validation.ts    # Zod schemas
│   └── constants.ts     # App constants
├── hooks/               # Custom hooks (if not in /hooks)
└── actions/             # Server actions
    ├── auth.ts
    ├── boats.ts
    └── listings.ts
```

## Type Definitions

```
types/
├── database.types.ts    # Supabase generated types
├── api.types.ts        # API response types
├── ui.types.ts         # UI component props
└── global.d.ts         # Global type declarations
```

## Public Assets

```
public/
├── images/
│   ├── logo.svg
│   ├── hero-bg.jpg
│   └── placeholders/
├── icons/
│   └── [icon-files]
├── fonts/
│   └── [font-files]
└── manifest.json       # PWA manifest
```

## Naming Conventions

### Files
- **Components:** PascalCase (e.g., `BoatCard.tsx`)
- **Utilities:** camelCase (e.g., `formatDate.ts`)
- **Types:** camelCase with `.types.ts` extension
- **Tests:** Same name with `.test.ts` or `.spec.ts`

### Folders
- **Route groups:** Wrapped in parentheses (e.g., `(auth)`)
- **Dynamic routes:** Wrapped in brackets (e.g., `[id]`)
- **General folders:** kebab-case (e.g., `user-profile`)

## Import Aliases

Configure in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/types/*": ["./types/*"],
      "@/hooks/*": ["./hooks/*"]
    }
  }
}
```

## Code Organization Best Practices

1. **Colocation:** Keep related files close together
2. **Barrel Exports:** Use index.ts files for cleaner imports
3. **Feature Folders:** Group by feature, not file type
4. **Shared Code:** Extract truly shared code to `/lib` or `/components/shared`

## TODO Comments for Structure
```typescript
// TODO[STRUCTURE]: Move auth components to features/auth folder
// TODO[STRUCTURE]: Create barrel exports for component folders
// TODO[STRUCTURE]: Set up path aliases in tsconfig.json
```

## Version History
- 2025-01-30: Initial folder structure documentation