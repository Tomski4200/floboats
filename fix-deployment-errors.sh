#!/bin/bash

# Script to automatically fix deployment errors using Claude
# This reads the deployment-errors.json and formats it for fixing

if [ ! -f "deployment-errors.json" ]; then
    echo "❌ No deployment-errors.json found. Run auto-fix-deployment.py first."
    exit 1
fi

echo "🔧 Deployment Error Fix Request"
echo "=============================="
echo ""
echo "The last deployment failed with the following errors:"
echo ""

# Extract and display errors from JSON
python3 -c "
import json
with open('deployment-errors.json', 'r') as f:
    data = json.load(f)
    
print(f'Deployment ID: {data[\"deployment_id\"]}')
print(f'Commit: {data[\"commit_sha\"][:7]}')
print('')

if data['errors']['type_errors']:
    print(f'TypeScript Errors ({len(data[\"errors\"][\"type_errors\"])}):')
    for error in data['errors']['type_errors']:
        print(f'  {error}')
    print('')

if data['fixes_needed']:
    print('Files to fix:')
    for fix in data['fixes_needed']:
        print(f'  - {fix[\"file\"]}')
"

echo ""
echo "Please fix these TypeScript errors so the deployment succeeds."
echo ""
echo "After fixing, you can run:"
echo "  ./deploy-and-check.sh"
echo ""
echo "Or for automatic monitoring:"
echo "  python3 auto-fix-deployment.py deploy"