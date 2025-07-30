-- Fix Event Venues access
\echo 'Setting up event_venues policies...'

-- Enable RLS
ALTER TABLE event_venues ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view venues" ON event_venues;
DROP POLICY IF EXISTS "Users can view all venues" ON event_venues;
DROP POLICY IF EXISTS "Authenticated users can create venues" ON event_venues;
DROP POLICY IF EXISTS "Users can update their own venues" ON event_venues;
DROP POLICY IF EXISTS "Users can delete their own venues" ON event_venues;
DROP POLICY IF EXISTS "Enable read access for all users" ON event_venues;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON event_venues;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON event_venues;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON event_venues;

-- Create simple, permissive policy for SELECT
CREATE POLICY "Enable read access for all users" ON event_venues
FOR SELECT USING (true);

-- Allow authenticated users to create venues
CREATE POLICY "Enable insert for authenticated users only" ON event_venues
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update venues they created
CREATE POLICY "Enable update for users based on user_id" ON event_venues
FOR UPDATE USING (auth.uid() = created_by);

-- Allow users to delete venues they created  
CREATE POLICY "Enable delete for users based on user_id" ON event_venues
FOR DELETE USING (auth.uid() = created_by);

-- Fix Event Categories access
\echo 'Setting up event_categories policies...'

-- Enable RLS
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view event categories" ON event_categories;
DROP POLICY IF EXISTS "Users can view all categories" ON event_categories;
DROP POLICY IF EXISTS "Enable read access for all users" ON event_categories;

-- Create simple policy for SELECT
CREATE POLICY "Enable read access for all users" ON event_categories
FOR SELECT USING (true);

-- Fix user_business_permissions access
\echo 'Setting up user_business_permissions policies...'

-- Check if table exists and has RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_business_permissions';

-- If the table exists, set up policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_business_permissions') THEN
        -- Enable RLS
        EXECUTE 'ALTER TABLE user_business_permissions ENABLE ROW LEVEL SECURITY';
        
        -- Drop existing policies
        EXECUTE 'DROP POLICY IF EXISTS "Users can view their own permissions" ON user_business_permissions';
        EXECUTE 'DROP POLICY IF EXISTS "Enable read access for users" ON user_business_permissions';
        
        -- Create policy for users to see their own permissions
        EXECUTE 'CREATE POLICY "Enable read access for users" ON user_business_permissions
                 FOR SELECT USING (auth.uid() = user_id)';
    END IF;
END $$;

-- Check businesses table RLS
\echo 'Checking businesses table policies...'
SELECT * FROM pg_policies WHERE tablename = 'businesses';

-- Test queries
\echo 'Testing event_venues access...'
SELECT COUNT(*) as venue_count FROM event_venues;
SELECT id, name, city, state FROM event_venues LIMIT 3;

\echo 'Testing event_categories access...'
SELECT COUNT(*) as category_count FROM event_categories;
SELECT id, name FROM event_categories LIMIT 3;

\echo 'Done! Please check the console logs in your browser to see if data is loading correctly.'