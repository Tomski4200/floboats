#!/bin/bash
# Fix all case-sensitive imports in the project

echo "Fixing case-sensitive imports..."

# Find all TypeScript/React files and fix the imports
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "./node_modules/*" -not -path "./.next/*" -exec sed -i 's/from '\''@\/components\/ui\/button'\''/from '\''@\/components\/ui\/Button'\''/g' {} \;
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "./node_modules/*" -not -path "./.next/*" -exec sed -i 's/from '\''@\/components\/ui\/input'\''/from '\''@\/components\/ui\/Input'\''/g' {} \;

echo "All imports fixed!"
