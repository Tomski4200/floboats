#!/bin/bash
# Pre-build script to fix case-sensitive imports and other issues

echo "Creating lowercase redirect files..."

# Create button.tsx
echo "export { Button, type ButtonProps } from './Button'" > components/ui/button.tsx

# Create input.tsx  
echo "export { Input, type InputProps } from './Input'" > components/ui/input.tsx

echo "Redirect files created successfully!"

# Run the actual build
npm run build
