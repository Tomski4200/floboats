#!/bin/bash
# Pre-build script for Vercel deployment

echo "Starting Vercel build process..."

# Note: Case-sensitive import handling is done via existing redirect files:
# - Button.tsx redirects to button-component.tsx
# - Input.tsx redirects to input-component.tsx
# These files are already committed to the repository

# Run the actual build
npm run build
