-- First, let's check what we're dealing with
\echo 'Checking event_venues table structure and policies...'
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'event_venues';
SELECT * FROM pg_policies WHERE tablename = 'event_venues';

\echo 'Checking event_categories table structure and policies...'
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'event_categories';
SELECT * FROM pg_policies WHERE tablename = 'event_categories';

\echo 'Checking businesses table structure...'
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'businesses' AND column_name IN ('id', 'business_name', 'owner_id', 'created_by', 'user_id');

-- Fix event_venues access
ALTER TABLE event_venues ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view venues" ON event_venues;
DROP POLICY IF EXISTS "Users can view all venues" ON event_venues;
DROP POLICY IF EXISTS "Authenticated users can create venues" ON event_venues;
DROP POLICY IF EXISTS "Users can update their own venues" ON event_venues;
DROP POLICY IF EXISTS "Users can delete their own venues" ON event_venues;

-- Create simple policy for viewing
CREATE POLICY "Anyone can view venues"
ON event_venues FOR SELECT
USING (true);

-- Create policy for authenticated users to create
CREATE POLICY "Authenticated users can create venues"
ON event_venues FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix event_categories access
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view event categories" ON event_categories;
DROP POLICY IF EXISTS "Users can view all categories" ON event_categories;

-- Create simple policy for viewing
CREATE POLICY "Anyone can view event categories"
ON event_categories FOR SELECT
USING (true);

-- Check sample data
\echo 'Sample venues:'
SELECT id, name, city, state FROM event_venues LIMIT 5;

\echo 'Sample categories:'
SELECT id, name FROM event_categories LIMIT 5;

\echo 'Sample businesses:'
SELECT id, business_name FROM businesses LIMIT 5;

-- If businesses doesn't have owner_id, let's check for alternative approaches
\echo 'Checking for user_business relationships:'
SELECT * FROM information_schema.tables WHERE table_name LIKE '%user%business%' OR table_name LIKE '%business%user%';

-- For now, let's make businesses viewable by all authenticated users
-- (you can adjust this based on your actual schema)
DROP POLICY IF EXISTS "Authenticated users can view businesses" ON businesses;
CREATE POLICY "Authenticated users can view businesses"
ON businesses FOR SELECT
USING (auth.uid() IS NOT NULL);