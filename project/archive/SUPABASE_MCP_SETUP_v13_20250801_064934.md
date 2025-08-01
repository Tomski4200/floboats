# Supabase MCP Setup Instructions

## Overview
This guide will help you set up the Supabase MCP (Model Context Protocol) for the FloBoats project.

## Prerequisites
- Node.js installed on your system
- Your Supabase Service Role Key (found in your Supabase project settings)

## Setup Steps

### 1. Get Your Service Role Key
1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your FloBoats project (lvfshqpmvynjtdwlkupx)
3. Navigate to Settings → API
4. Copy your `service_role` key (keep this secret!)

### 2. Update the MCP Configuration
Edit the `mcp-supabase-config.json` file and replace `YOUR_SERVICE_ROLE_KEY_HERE` with your actual service role key.

### 3. Install Claude Desktop (if not already installed)
Download from: https://claude.ai/download

### 4. Configure Claude Desktop
1. Open Claude Desktop settings
2. Go to Developer → Model Context Protocol
3. Click "Add Configuration"
4. Select "From File" and choose the `mcp-supabase-config.json` file from this directory
5. Alternatively, manually add:
   ```json
   {
     "supabase": {
       "command": "npx",
       "args": ["-y", "@modelcontextprotocol/server-supabase"],
       "env": {
         "SUPABASE_URL": "https://lvfshqpmvynjtdwlkupx.supabase.co",
         "SUPABASE_SERVICE_KEY": "your-service-role-key"
       }
     }
   }
   ```

### 5. Restart Claude Desktop
After adding the configuration, restart Claude Desktop for the changes to take effect.

## Available MCP Tools
Once configured, you'll have access to Supabase-specific tools prefixed with `mcp__supabase__`:
- Database queries
- Table operations
- RLS policy management
- Storage operations
- And more...

## Security Notes
- **NEVER** commit your service role key to version control
- Add `mcp-supabase-config.json` to your `.gitignore` if it contains the actual key
- The service role key bypasses RLS, so use it carefully

## Environment Variables Reference
Your `.env` file already contains:
- `SUPABASE_URL`: https://lvfshqpmvynjtdwlkupx.supabase.co
- `SUPABASE_ANON_KEY`: For client-side operations
- `SUPABASE_PROJECT_ID`: lvfshqpmvynjtdwlkupx
- Database URLs for direct connections (need password)

## Testing the Connection
Once set up, you can test by asking Claude to:
1. List your Supabase tables
2. Query data from a specific table
3. Check RLS policies

## Troubleshooting
- If MCP tools don't appear, ensure Claude Desktop is fully restarted
- Check that the service role key is correctly formatted (no extra spaces)
- Verify the Supabase URL matches your project