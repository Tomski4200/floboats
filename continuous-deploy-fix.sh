#!/bin/bash

# Continuous deployment with automatic error fixing
# This script will:
# 1. Deploy the code
# 2. Check for errors
# 3. Show errors for Claude to fix
# 4. Wait for fixes
# 5. Repeat until successful

MAX_ATTEMPTS=5
ATTEMPT=1

echo "🔄 Continuous Deploy & Fix"
echo "========================="
echo ""
echo "This will continuously deploy and help fix errors until successful."
echo "Maximum attempts: $MAX_ATTEMPTS"
echo ""

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    echo "🚀 Deployment attempt #$ATTEMPT"
    echo "------------------------"
    
    # Run deployment and monitoring
    python3 auto-fix-deployment.py deploy
    RESULT=$?
    
    if [ $RESULT -eq 0 ]; then
        echo ""
        echo "✅ SUCCESS! Deployment completed without errors."
        echo ""
        # Show the deployment URL
        python3 -c "
import json
try:
    with open('.vercel/project.json', 'r') as f:
        project = json.load(f)
    print(f'🌐 Your app is live at: https://floboats.vercel.app')
except:
    pass
"
        exit 0
    fi
    
    # If there are errors, show them
    if [ -f "deployment-errors.json" ]; then
        echo ""
        echo "❌ Deployment failed. Here are the errors:"
        echo ""
        
        # Display the errors in a Claude-friendly format
        ./fix-deployment-errors.sh
        
        echo ""
        echo "🤖 Please fix the above errors, then press Enter to continue..."
        echo "   (or press Ctrl+C to stop)"
        read -p ""
        
        # Check if any files were modified
        if git diff --quiet; then
            echo "⚠️  No changes detected. Are you sure you fixed the errors?"
            read -p "Press Enter to continue anyway, or Ctrl+C to stop: "
        else
            # Commit the fixes
            echo ""
            echo "📝 Committing fixes..."
            git add -A
            
            # Extract error summary for commit message
            ERROR_SUMMARY=$(python3 -c "
import json
with open('deployment-errors.json', 'r') as f:
    data = json.load(f)
    errors = data['errors']['type_errors']
    if errors:
        # Get unique file names
        files = set()
        for error in errors:
            if '.tsx:' in error or '.ts:' in error:
                file = error.split(':')[0].strip()
                if file.startswith('./'):
                    file = file[2:]
                files.add(file.split('/')[-1])
        if files:
            print('Fix TypeScript errors in ' + ', '.join(list(files)[:3]))
        else:
            print('Fix deployment errors')
    else:
        print('Fix deployment errors')
")
            
            git commit -m "$ERROR_SUMMARY

Automated fix for Vercel deployment errors"
            echo "✅ Changes committed"
        fi
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    echo ""
done

echo ""
echo "❌ Maximum attempts reached. Deployment still failing."
echo "   You may need to manually debug the issue."
exit 1