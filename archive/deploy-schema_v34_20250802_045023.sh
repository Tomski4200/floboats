#!/bin/bash

# FloBoats Schema Deployment Script
# Run this script once you have the database password

# Check if password is provided
if [ -z "$1" ]; then
    echo "Usage: ./deploy-schema.sh <database_password>"
    echo "Example: ./deploy-schema.sh your_db_password"
    exit 1
fi

DB_PASSWORD=$1
DB_URL="postgresql://postgres.lvfshqpmvynjtdwlkupx:${DB_PASSWORD}@aws-0-us-east-2.pooler.supabase.com:5432/postgres"

echo "Deploying FloBoats schema to Supabase..."
echo "Database: lvfshqpmvynjtdwlkupx"

# Execute the schema
psql "$DB_URL" -f floboats_schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema deployed successfully!"
    echo "Next steps:"
    echo "1. Verify tables in Supabase dashboard"
    echo "2. Test RLS policies"
    echo "3. Run seed data script"
else
    echo "❌ Schema deployment failed!"
    echo "Check the error messages above"
    exit 1
fi