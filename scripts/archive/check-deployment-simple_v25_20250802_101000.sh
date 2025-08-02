#!/bin/bash

# Simplified deployment checker without jq dependency
# Usage: ./scripts/check-deployment-simple.sh

# Check if VERCEL_TOKEN is set
if [ -z "$VERCEL_TOKEN" ]; then
    echo "Error: VERCEL_TOKEN environment variable is not set"
    exit 1
fi

PROJECT_ID="${VERCEL_PROJECT_ID:-prj_DU3SwuN5Jx3mTNy4TDCIZMAwakok}"

echo "Fetching latest deployment for project: $PROJECT_ID"
echo "========================================="

# Fetch latest deployments
response=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
    "https://api.vercel.com/v9/projects/$PROJECT_ID/deployments?limit=1")

# Extract deployment ID using grep and sed (no jq required)
deployment_id=$(echo "$response" | grep -o '"uid":"[^"]*"' | head -1 | sed 's/"uid":"\([^"]*\)"/\1/')

if [ -z "$deployment_id" ]; then
    echo "Could not fetch deployment ID"
    echo "Response: $response"
    exit 1
fi

echo "Latest deployment ID: $deployment_id"

# Fetch deployment details
deployment_details=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
    "https://api.vercel.com/v13/deployments/$deployment_id")

# Extract status
state=$(echo "$deployment_details" | grep -o '"readyState":"[^"]*"' | sed 's/"readyState":"\([^"]*\)"/\1/')
url=$(echo "$deployment_details" | grep -o '"url":"[^"]*"' | sed 's/"url":"\([^"]*\)"/\1/')

echo "Status: $state"
if [ ! -z "$url" ]; then
    echo "URL: https://$url"
fi

echo -e "\n📋 Build Logs:"
echo "========================================="

# Fetch and display logs
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
    "https://api.vercel.com/v2/deployments/$deployment_id/events?direction=forward&limit=1000" | \
    grep -o '"text":"[^"]*"' | \
    sed 's/"text":"\([^"]*\)"/\1/g' | \
    sed 's/\\n/\n/g' | \
    sed 's/\\t/\t/g' | \
    sed 's/\\\"/"/g' | \
    sed 's/\\\//\//g'

echo -e "\n========================================="
echo "Final Status: $state"

if [ "$state" = "ERROR" ] || [ "$state" = "FAILED" ]; then
    echo "❌ Deployment failed!"
    exit 1
elif [ "$state" = "READY" ]; then
    echo "✅ Deployment succeeded!"
else
    echo "🔄 Status: $state"
fi