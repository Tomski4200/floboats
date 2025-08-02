#!/bin/bash

echo "Checking for common TypeScript issues..."
echo "======================================="

echo -e "\n1. Checking for any[] usage:"
grep -r "any\[\]" app --include="*.tsx" --include="*.ts" --exclude-dir="archive" | grep -v "interface" | head -10

echo -e "\n2. Checking for useState<any>:"
grep -r "useState<any>" app --include="*.tsx" --include="*.ts" --exclude-dir="archive" | head -10

echo -e "\n3. Checking for onChange without types:"
grep -r "onChange.*=.*{.*e[[:space:]]*=>" app --include="*.tsx" --exclude-dir="archive" | grep -v "React.ChangeEvent" | head -10

echo -e "\n4. Checking for untyped array declarations:"
grep -r "= \[\]" app --include="*.tsx" --include="*.ts" --exclude-dir="archive" | grep -v "const\|let\|var" | head -10

echo -e "\n5. Running TypeScript compiler check (this may take a moment):"
npx tsc --noEmit 2>&1 | grep -A 2 -B 2 "error TS" | head -50

echo -e "\nDone!"