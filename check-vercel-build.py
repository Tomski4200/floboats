#!/usr/bin/env python3

import os
import sys
import json
import time
import requests
from datetime import datetime

# Load environment variables
def load_env():
    env_file = '.env.local'
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value

load_env()

VERCEL_TOKEN = os.environ.get('VERCEL_TOKEN')
VERCEL_PROJECT_ID = os.environ.get('VERCEL_PROJECT_ID')

if not VERCEL_TOKEN or not VERCEL_PROJECT_ID:
    print("❌ Error: VERCEL_TOKEN and VERCEL_PROJECT_ID must be set in .env.local")
    sys.exit(1)

def check_deployment():
    """Check the latest deployment status"""
    headers = {'Authorization': f'Bearer {VERCEL_TOKEN}'}
    url = f'https://api.vercel.com/v9/projects/{VERCEL_PROJECT_ID}?latestDeployments=1'
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        project_name = data.get('name', '')
        latest_deployments = data.get('latestDeployments', [])
        
        if not latest_deployments:
            print("❌ No deployments found")
            return 1
        
        deployment = latest_deployments[0]
        deployment_id = deployment.get('id', 'Unknown')
        deployment_state = deployment.get('readyState', 'Unknown')
        deployment_url = deployment.get('url', '')
        created_at = deployment.get('createdAt', 0)
        
        # Convert timestamp to readable format
        if created_at:
            created_date = datetime.fromtimestamp(created_at / 1000).strftime('%Y-%m-%d %H:%M:%S')
        else:
            created_date = 'Unknown'
        
        # Get commit info
        meta = deployment.get('meta', {})
        commit_msg = meta.get('githubCommitMessage', 'No commit message')
        commit_sha = meta.get('githubCommitSha', '')[:7]  # First 7 chars
        
        print("📋 Latest Deployment Info:")
        print(f"   Project: {project_name}")
        print(f"   ID: {deployment_id}")
        print(f"   State: {deployment_state}")
        print(f"   URL: https://{deployment_url}")
        print(f"   Created: {created_date}")
        print(f"   Commit: {commit_sha} - {commit_msg.split('\\n')[0]}")
        print("")
        
        # Check if it's the correct project
        if project_name != 'floboats':
            print("⚠️  WARNING: Deployment might be to wrong project!")
            print(f"   Expected: floboats")
            print(f"   Found: {project_name}")
        
        # Return status based on state
        if deployment_state == 'READY':
            print("✅ Build SUCCESSFUL!")
            return 0
        elif deployment_state in ['ERROR', 'FAILED']:
            print("❌ Build FAILED!")
            get_build_logs(deployment_id)
            return 1
        elif deployment_state in ['BUILDING', 'DEPLOYING', 'INITIALIZING']:
            print("🔄 Build in progress...")
            return 2
        else:
            print(f"❓ Unknown state: {deployment_state}")
            return 3
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching deployment data: {e}")
        return 1
    except json.JSONDecodeError as e:
        print(f"❌ Error parsing response: {e}")
        return 1

def get_build_logs(deployment_id):
    """Get build logs for a failed deployment"""
    print("")
    print("📜 Fetching build logs...")
    
    headers = {'Authorization': f'Bearer {VERCEL_TOKEN}'}
    url = f'https://api.vercel.com/v2/deployments/{deployment_id}/events?build=1&limit=100'
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        logs = response.json()
        
        error_count = 0
        for log in logs:
            if isinstance(log, dict):
                text = log.get('text', '')
                if any(keyword in text.lower() for keyword in ['error', 'failed', 'type error']):
                    print(f"   {text}")
                    error_count += 1
                    if error_count >= 20:
                        break
                        
    except Exception as e:
        print(f"   Could not fetch logs: {e}")

def main():
    # Get wait time from command line argument
    wait_time = int(sys.argv[1]) if len(sys.argv) > 1 else 120
    
    print("🚀 Checking Vercel deployment status for project: floboats")
    print(f"Project ID: {VERCEL_PROJECT_ID}")
    print("")
    
    if wait_time > 0:
        print(f"⏳ Waiting {wait_time} seconds for build to complete...")
        time.sleep(wait_time)
    
    # Check deployment status
    exit_code = check_deployment()
    
    # If still building, check periodically
    if exit_code == 2:
        print("")
        print("🔄 Build still in progress. Checking every 30 seconds...")
        
        for i in range(1, 11):  # Maximum 10 additional checks (5 minutes)
            time.sleep(30)
            print("")
            print(f"Check #{i}:")
            exit_code = check_deployment()
            
            if exit_code != 2:
                break
    
    sys.exit(exit_code)

if __name__ == "__main__":
    main()