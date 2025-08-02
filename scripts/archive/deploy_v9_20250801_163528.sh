#!/bin/bash

# Script to trigger Vercel deployment via deploy hook
# Usage: ./scripts/deploy.sh

# Check if VERCEL_DEPLOY_HOOK_URL is set
if [ -z "$VERCEL_DEPLOY_HOOK_URL" ]; then
    echo "Error: VERCEL_DEPLOY_HOOK_URL environment variable is not set"
    echo "Please set it in your .env.local file or export it:"
    echo "export VERCEL_DEPLOY_HOOK_URL='your-deploy-hook-url'"
    exit 1
fi

echo "🚀 Triggering Vercel deployment..."

# Trigger the deploy hook
response=$(curl -X POST "$VERCEL_DEPLOY_HOOK_URL" -w "\n%{http_code}" 2>/dev/null)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "201" ]; then
    echo "✅ Deployment triggered successfully!"
    echo "Response: $body"
    echo ""
    echo "Check your Vercel dashboard for deployment progress."
else
    echo "❌ Failed to trigger deployment"
    echo "HTTP Status Code: $http_code"
    echo "Response: $body"
    exit 1
fi