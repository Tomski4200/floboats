#!/bin/bash

# Script to check Vercel deployment status and fetch logs
# Usage: ./scripts/check-deployment.sh [deployment-id]

# Check if VERCEL_TOKEN is set
if [ -z "$VERCEL_TOKEN" ]; then
    echo "Error: VERCEL_TOKEN environment variable is not set"
    echo "Please create a token at https://vercel.com/account/tokens"
    echo "Then set it: export VERCEL_TOKEN='your-token'"
    exit 1
fi

# Get deployment ID from argument or use the last deployment
DEPLOYMENT_ID="$1"

if [ -z "$DEPLOYMENT_ID" ]; then
    echo "Fetching latest deployment..."
    # Get project ID from Vercel config or environment
    PROJECT_ID="${VERCEL_PROJECT_ID:-prj_DU3SwuN5Jx3mTNy4TDCIZMAwakok}"
    
    # Fetch latest deployment
    LATEST_DEPLOYMENT=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
        "https://api.vercel.com/v9/projects/$PROJECT_ID/deployments?limit=1" | \
        jq -r '.deployments[0].uid')
    
    if [ "$LATEST_DEPLOYMENT" = "null" ] || [ -z "$LATEST_DEPLOYMENT" ]; then
        echo "Could not fetch latest deployment"
        exit 1
    fi
    
    DEPLOYMENT_ID="$LATEST_DEPLOYMENT"
fi

echo "Checking deployment: $DEPLOYMENT_ID"
echo "========================================="

# Function to fetch deployment status
check_status() {
    local response=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
        "https://api.vercel.com/v13/deployments/$DEPLOYMENT_ID")
    
    local state=$(echo "$response" | jq -r '.readyState')
    local url=$(echo "$response" | jq -r '.url')
    
    echo "Status: $state"
    if [ "$url" != "null" ]; then
        echo "URL: https://$url"
    fi
    
    echo "$state"
}

# Function to fetch build logs
fetch_logs() {
    echo -e "\n📋 Build Logs:"
    echo "========================================="
    
    curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
        "https://api.vercel.com/v2/deployments/$DEPLOYMENT_ID/events?direction=forward&limit=1000" | \
        jq -r '.[] | select(.type == "stdout" or .type == "stderr") | .payload.text' | \
        sed 's/\\n/\n/g' | sed 's/\\t/\t/g'
}

# Check initial status
STATUS=$(check_status)

# If deployment is still building, wait and show logs
if [ "$STATUS" = "BUILDING" ] || [ "$STATUS" = "INITIALIZING" ] || [ "$STATUS" = "QUEUED" ]; then
    echo -e "\n⏳ Deployment in progress. Fetching logs...\n"
    
    # Continuously fetch logs until deployment is done
    while [ "$STATUS" = "BUILDING" ] || [ "$STATUS" = "INITIALIZING" ] || [ "$STATUS" = "QUEUED" ]; do
        fetch_logs
        sleep 5
        STATUS=$(check_status)
    done
fi

# Show final status
echo -e "\n========================================="
echo "Final Status: $STATUS"

if [ "$STATUS" = "ERROR" ] || [ "$STATUS" = "FAILED" ]; then
    echo "❌ Deployment failed!"
    fetch_logs
    exit 1
elif [ "$STATUS" = "READY" ]; then
    echo "✅ Deployment succeeded!"
else
    echo "🤔 Unknown status: $STATUS"
    fetch_logs
fi