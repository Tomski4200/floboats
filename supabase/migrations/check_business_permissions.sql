-- Check if there's a user_business_permissions table
SELECT * FROM information_schema.tables 
WHERE table_name LIKE '%business%permission%' 
   OR table_name LIKE '%user%business%';

-- Check columns in businesses table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'businesses'
ORDER BY ordinal_position;

-- Check if there's any column that might link to users
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'businesses'
  AND (column_name LIKE '%user%' OR column_name LIKE '%owner%' OR column_name LIKE '%author%');

-- Try to fetch a sample business to see its structure
SELECT * FROM businesses LIMIT 1;