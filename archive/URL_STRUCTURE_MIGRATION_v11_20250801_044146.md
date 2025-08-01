# URL Structure Migration Guide

## Overview
We've migrated from `/businesses/` to `/directory/` URLs and updated slugs to include city and state.

### Old Structure
- URL: `/businesses/keys-marine-service`
- Slug: `keys-marine-service`

### New Structure
- URL: `/directory/keys-marine-service-marathon-fl`
- Slug: `keys-marine-service-marathon-fl`

## Changes Made

### 1. Folder Structure
- Renamed `/app/businesses/` to `/app/directory/`

### 2. Updated Links
Updated all references from `/businesses` to `/directory` in:
- Header navigation (desktop and mobile)
- Footer links
- BusinessOwnerCta component
- Homepage (marketplace listings)
- Directory listing page
- Business detail page (back button)
- Claim business page

### 3. Slug Generation
Created `lib/utils/slug-generator.ts` with functions:
- `generateBusinessSlug()` - Creates slugs with city and state
- `extractBusinessNameFromSlug()` - Extracts business name from full slug

## Database Migration Required

Run the following SQL script in your Supabase SQL editor:
```sql
-- Run the script in update_business_slugs_with_location.sql
```

This will update all existing business slugs to include city and state.

## Testing Checklist

After running the SQL migration:
1. [ ] Visit homepage - check business links work
2. [ ] Visit `/directory` - verify listing page loads
3. [ ] Click on a business - verify detail page loads with new URL format
4. [ ] Test navigation links in header/footer
5. [ ] Test "Claim Your Business" flow
6. [ ] Verify all business cards link to correct URLs

## Redirects (Optional)

You may want to set up redirects from old URLs to new ones:
```javascript
// In next.config.ts
module.exports = {
  async redirects() {
    return [
      {
        source: '/businesses/:slug',
        destination: '/directory/:slug',
        permanent: true,
      },
    ]
  },
}
```

## Notes
- Dashboard routes (`/dashboard/businesses/`) were not changed as they're admin-facing
- The new slug format improves SEO by including location information
- This change affects all business-related URLs in the public-facing site