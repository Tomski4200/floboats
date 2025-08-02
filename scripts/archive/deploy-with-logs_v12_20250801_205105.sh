#!/bin/bash

# Deploy and show logs using Vercel CLI
# Usage: ./scripts/deploy-with-logs.sh

echo "🚀 Deploying to Vercel..."

# Check if we're in production mode
if [ "$1" = "--prod" ]; then
    echo "Deploying to production..."
    npx vercel --prod --token "$VERCEL_TOKEN" 2>&1
else
    echo "Deploying to preview..."
    npx vercel --token "$VERCEL_TOKEN" 2>&1
fi