# FloBoats Documentation System
*Last Updated: 2025-01-30 14:30 UTC*

## Overview
This documentation system is designed to track all technical decisions, implementation details, and feature documentation for the FloBoats project. Each document includes timestamps to track when information may need review.

## Documentation Structure

```
documentation/
├── README.md           # This file - explains the documentation system
├── INDEX.md           # Navigation index for all documentation
├── features/          # Feature-specific documentation
│   ├── authentication.md
│   ├── boat-management.md
│   ├── marketplace.md
│   └── ...
├── api/              # API endpoint documentation
│   ├── rest-endpoints.md
│   ├── database-queries.md
│   └── ...
├── database/         # Database schema and patterns
│   ├── schema-overview.md
│   ├── rls-policies.md
│   └── ...
├── components/       # Reusable component documentation
│   ├── ui-components.md
│   ├── layout-components.md
│   └── ...
├── integrations/     # Third-party service integrations
│   ├── supabase.md
│   ├── mapbox.md
│   └── ...
├── deployment/       # Deployment and DevOps
│   ├── vercel-setup.md
│   ├── environment-variables.md
│   └── ...
└── architecture/     # System design and patterns
    ├── folder-structure.md
    ├── state-management.md
    └── ...
```

## Documentation Standards

### 1. File Naming
- Use kebab-case for all files: `feature-name.md`
- Be descriptive but concise
- Group related docs in appropriate folders

### 2. Document Header Template
Every documentation file should start with:

```markdown
# [Document Title]
*Created: YYYY-MM-DD HH:MM UTC*  
*Last Updated: YYYY-MM-DD HH:MM UTC*  
*Status: Draft | Active | Needs Review | Deprecated*

## Overview
Brief description of what this document covers.

## Table of Contents
- [Section 1](#section-1)
- [Section 2](#section-2)
```

### 3. Update Tracking
- **Created:** When the document was first written
- **Last Updated:** Last significant change
- **Status:**
  - `Draft` - Work in progress
  - `Active` - Current and accurate
  - `Needs Review` - May be outdated (>30 days without update on critical docs)
  - `Deprecated` - No longer relevant but kept for history

### 4. Cross-References
- Link to related documents using relative paths
- Reference code files using: `See: /app/api/boats/route.ts`
- Link to specific lines: `See: /app/api/boats/route.ts:L45-L67`

### 5. Code Examples
Include relevant code examples with language specification:

```typescript
// Example code here
```

### 6. Version History
For critical documents, maintain a version history at the bottom:

```markdown
## Version History
- 2025-01-30: Initial documentation
- 2025-02-05: Added error handling section
- 2025-02-10: Updated API response format
```

## Maintenance Guidelines

### Review Schedule
- **Features:** Review when implementation changes
- **API:** Review on any endpoint change
- **Database:** Review on schema modifications
- **Components:** Update when props/behavior changes
- **Architecture:** Review quarterly or on major changes

### Automated Checks
We use these markers in documentation:
- `TODO:` - Documentation to be written
- `OUTDATED:` - Needs immediate update
- `VERIFY:` - Needs fact-checking
- `EXAMPLE NEEDED:` - Requires code example

### Finding Stale Documentation
```bash
# Find docs not updated in 30+ days
find documentation -name "*.md" -mtime +30 -type f

# Search for review markers
grep -r "OUTDATED\|VERIFY\|TODO" documentation/

# List docs by last modified date
find documentation -name "*.md" -type f -exec ls -lt {} + | head -20
```

## Contributing to Documentation

1. **When to Document:**
   - New feature implementation
   - API endpoint creation/change
   - Architecture decisions
   - Complex component creation
   - Integration setup

2. **Keep It Current:**
   - Update docs in the same PR as code changes
   - Mark sections as `OUTDATED` if you notice stale info
   - Add `TODO` markers for missing information

3. **Be Concise but Complete:**
   - Include "why" not just "what"
   - Add examples for complex concepts
   - Link to external resources when helpful

## Quick Links
- [Documentation Index](./INDEX.md)
- [Current Sprint](../CURRENT_SPRINT.md)
- [Overall Roadmap](../ROADMAP.md)