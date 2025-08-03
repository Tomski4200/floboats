#!/usr/bin/env python3

import os
import sys
import json
import time
import subprocess
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

def get_latest_deployment():
    """Get the latest deployment info"""
    headers = {'Authorization': f'Bearer {VERCEL_TOKEN}'}
    url = f'https://api.vercel.com/v9/projects/{VERCEL_PROJECT_ID}?latestDeployments=1'
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        latest_deployments = data.get('latestDeployments', [])
        if not latest_deployments:
            return None
            
        return latest_deployments[0]
    except:
        return None

def get_build_logs(deployment_id):
    """Get build logs with errors"""
    headers = {'Authorization': f'Bearer {VERCEL_TOKEN}'}
    url = f'https://api.vercel.com/v2/deployments/{deployment_id}/events?build=1&limit=500'
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        logs = response.json()
        
        errors = []
        type_errors = []
        failed_compile = False
        
        # Track context for errors
        prev_text = ""
        
        for log in logs:
            if isinstance(log, dict):
                payload = log.get('payload', {})
                text = payload.get('text', '')
                
                # Look for TypeScript errors
                if 'Type error:' in text:
                    # Add the previous line for context (usually has file:line info)
                    if prev_text and ('.tsx:' in prev_text or '.ts:' in prev_text):
                        type_errors.append(f"{prev_text}\n{text}")
                    else:
                        type_errors.append(text)
                elif 'Failed to compile' in text:
                    failed_compile = True
                elif any(keyword in text.lower() for keyword in ['error:', 'error building', 'build error']):
                    errors.append(text)
                
                prev_text = text
        
        return {
            'failed_compile': failed_compile,
            'type_errors': type_errors,
            'other_errors': errors
        }
    except:
        return None

def extract_error_details(error_logs):
    """Extract specific error details for fixing"""
    fixes_needed = []
    
    for error in error_logs.get('type_errors', []):
        # Extract file path and line number
        if '.tsx:' in error or '.ts:' in error:
            parts = error.split(':')
            if len(parts) >= 2:
                file_path = parts[0].strip()
                # Clean up the file path
                if file_path.startswith('./'):
                    file_path = file_path[2:]
                
                fixes_needed.append({
                    'file': file_path,
                    'error': error,
                    'type': 'typescript'
                })
    
    return fixes_needed

def save_error_report(deployment, error_logs, fixes_needed):
    """Save error report to a file"""
    report = {
        'deployment_id': deployment.get('id'),
        'deployment_url': deployment.get('url'),
        'created_at': deployment.get('createdAt'),
        'commit_sha': deployment.get('meta', {}).get('githubCommitSha', ''),
        'errors': error_logs,
        'fixes_needed': fixes_needed,
        'timestamp': datetime.now().isoformat()
    }
    
    with open('deployment-errors.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    return report

def wait_for_deployment(timeout=300):
    """Wait for deployment to complete"""
    print("⏳ Waiting for deployment to start...")
    time.sleep(10)  # Initial wait
    
    start_time = time.time()
    while time.time() - start_time < timeout:
        deployment = get_latest_deployment()
        if deployment:
            state = deployment.get('readyState', '')
            if state in ['READY', 'ERROR', 'FAILED']:
                return deployment
            elif state in ['BUILDING', 'DEPLOYING']:
                print(f"🔄 Deployment {state}... (elapsed: {int(time.time() - start_time)}s)")
        
        time.sleep(15)
    
    return None

def main():
    print("🚀 Auto-Fix Deployment Monitor")
    print("=" * 50)
    
    # Check if we should deploy first
    if len(sys.argv) > 1 and sys.argv[1] == 'deploy':
        print("📤 Pushing to GitHub to trigger deployment...")
        result = subprocess.run(['git', 'push', 'origin', 'main'], capture_output=True, text=True)
        if result.returncode != 0:
            print(f"❌ Failed to push: {result.stderr}")
            return 1
        print("✅ Pushed successfully")
        print("")
    
    # Wait for deployment to complete
    deployment = wait_for_deployment()
    
    if not deployment:
        print("❌ Timeout waiting for deployment")
        return 1
    
    state = deployment.get('readyState', '')
    deployment_id = deployment.get('id', '')
    
    print(f"\n📋 Deployment Status: {state}")
    print(f"   ID: {deployment_id}")
    print(f"   URL: https://{deployment.get('url', '')}")
    
    if state == 'READY':
        print("\n✅ Deployment SUCCESSFUL! No fixes needed.")
        # Clean up old error report if exists
        if os.path.exists('deployment-errors.json'):
            os.remove('deployment-errors.json')
        return 0
    
    elif state in ['ERROR', 'FAILED']:
        print("\n❌ Deployment FAILED!")
        print("📜 Fetching error logs...\n")
        
        # Get error logs
        error_logs = get_build_logs(deployment_id)
        if not error_logs:
            print("Could not fetch error logs")
            return 1
        
        # Extract fixes needed
        fixes_needed = extract_error_details(error_logs)
        
        # Save error report
        report = save_error_report(deployment, error_logs, fixes_needed)
        
        # Display errors
        if error_logs['type_errors']:
            print(f"🔴 Found {len(error_logs['type_errors'])} TypeScript errors:\n")
            for i, error in enumerate(error_logs['type_errors'][:10], 1):
                print(f"{i}. {error}")
                print("")
        
        if fixes_needed:
            print(f"\n📝 Files that need fixing:")
            for fix in fixes_needed:
                print(f"   - {fix['file']}")
        
        print(f"\n💾 Error report saved to: deployment-errors.json")
        print("\n🤖 To have Claude fix these errors automatically, run:")
        print("   python3 auto-fix-deployment.py fix")
        
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())