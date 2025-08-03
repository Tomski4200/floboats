#!/bin/bash

# Script to deploy to Vercel and automatically check build status
# This ensures deployment goes to the correct "floboats" project

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Warning: You have uncommitted changes"
    read -p "Do you want to commit them first? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " commit_msg
        git add -A
        git commit -m "$commit_msg"
    fi
fi

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "🌿 Current branch: $CURRENT_BRANCH"

# Verify project configuration
echo ""
echo "🔍 Verifying Vercel project configuration..."
echo "   Project Name: floboats"
echo "   Project ID: $VERCEL_PROJECT_ID"

# Push to GitHub (which triggers Vercel deployment)
echo ""
echo "🚀 Pushing to GitHub to trigger Vercel deployment..."
git push origin $CURRENT_BRANCH

if [ $? -ne 0 ]; then
    echo "❌ Failed to push to GitHub"
    exit 1
fi

echo "✅ Successfully pushed to GitHub"
echo ""

# Wait a moment for Vercel to pick up the push
echo "⏳ Waiting 10 seconds for Vercel to start deployment..."
sleep 10

# Check the build status
echo ""
echo "🔍 Checking Vercel build status..."
./check-vercel-build.sh 120