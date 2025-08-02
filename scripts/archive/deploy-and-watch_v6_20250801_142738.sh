#!/bin/bash

# Script to trigger Vercel deployment and watch logs
# Usage: ./scripts/deploy-and-watch.sh

# Check if VERCEL_DEPLOY_HOOK_URL is set
if [ -z "$VERCEL_DEPLOY_HOOK_URL" ]; then
    echo "Error: VERCEL_DEPLOY_HOOK_URL environment variable is not set"
    exit 1
fi

# Check if VERCEL_TOKEN is set for log fetching
if [ -z "$VERCEL_TOKEN" ]; then
    echo "Warning: VERCEL_TOKEN not set. Cannot fetch logs automatically."
    echo "To enable log fetching:"
    echo "1. Create a token at https://vercel.com/account/tokens"
    echo "2. export VERCEL_TOKEN='your-token'"
    echo ""
fi

echo "🚀 Triggering Vercel deployment..."

# Trigger the deploy hook
response=$(curl -X POST "$VERCEL_DEPLOY_HOOK_URL" -w "\n%{http_code}" 2>/dev/null)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "201" ]; then
    echo "✅ Deployment triggered successfully!"
    
    # Extract job ID if available
    job_id=$(echo "$body" | jq -r '.job.id' 2>/dev/null)
    
    if [ ! -z "$job_id" ] && [ "$job_id" != "null" ] && [ ! -z "$VERCEL_TOKEN" ]; then
        echo "Job ID: $job_id"
        echo ""
        echo "⏳ Waiting for deployment to start..."
        sleep 5
        
        # Try to find the deployment ID for this job
        PROJECT_ID="${VERCEL_PROJECT_ID:-prj_DU3SwuN5Jx3mTNy4TDCIZMAwakok}"
        
        # Get recent deployments and find our job
        DEPLOYMENT_ID=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
            "https://api.vercel.com/v9/projects/$PROJECT_ID/deployments?limit=5" | \
            jq -r '.deployments[0].uid')
        
        if [ ! -z "$DEPLOYMENT_ID" ] && [ "$DEPLOYMENT_ID" != "null" ]; then
            echo "Found deployment: $DEPLOYMENT_ID"
            echo ""
            # Watch the deployment
            ./scripts/check-deployment.sh "$DEPLOYMENT_ID"
        else
            echo "Could not find deployment ID. Check your Vercel dashboard."
        fi
    else
        echo "Check your Vercel dashboard for deployment progress."
        echo "Response: $body"
    fi
else
    echo "❌ Failed to trigger deployment"
    echo "HTTP Status Code: $http_code"
    echo "Response: $body"
    exit 1
fi