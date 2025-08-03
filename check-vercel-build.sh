#!/bin/bash

# Script to check Vercel build status after deployment
# Usage: ./check-vercel-build.sh [wait_seconds]
# This is a wrapper that calls the Python script for better JSON parsing

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required to run this script"
    exit 1
fi

# Pass all arguments to the Python script
python3 check-vercel-build.py "$@"