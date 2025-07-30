-- Check if event_venues table has RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'event_venues';

-- Check existing policies on event_venues
SELECT * FROM pg_policies WHERE tablename = 'event_venues';

-- If no policies exist, create basic ones to allow authenticated users to read venues
-- and venue creators to manage their venues

-- Enable RLS if not already enabled
ALTER TABLE event_venues ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Anyone can view venues" ON event_venues;
DROP POLICY IF EXISTS "Authenticated users can create venues" ON event_venues;
DROP POLICY IF EXISTS "Users can update their own venues" ON event_venues;
DROP POLICY IF EXISTS "Users can delete their own venues" ON event_venues;

-- Create new policies

-- Anyone can view all venues (they're public locations)
CREATE POLICY "Anyone can view venues"
ON event_venues FOR SELECT
USING (true);

-- Authenticated users can create venues
CREATE POLICY "Authenticated users can create venues"
ON event_venues FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update venues they created
CREATE POLICY "Users can update their own venues"
ON event_venues FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Users can delete venues they created
CREATE POLICY "Users can delete their own venues"
ON event_venues FOR DELETE
USING (auth.uid() = created_by);

-- Also check if businesses table has proper RLS for fetching user's businesses
SELECT * FROM pg_policies WHERE tablename = 'businesses' AND policyname LIKE '%select%' OR policyname LIKE '%view%';