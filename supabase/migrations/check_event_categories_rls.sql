-- Check if event_categories table has RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'event_categories';

-- Check existing policies on event_categories
SELECT * FROM pg_policies WHERE tablename = 'event_categories';

-- If RLS is enabled but no policies exist, create them
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Anyone can view event categories" ON event_categories;
DROP POLICY IF EXISTS "Only admins can manage event categories" ON event_categories;

-- Create new policies

-- Anyone can view all event categories
CREATE POLICY "Anyone can view event categories"
ON event_categories FOR SELECT
USING (true);

-- Only admins can manage categories (optional - you might want to adjust this)
-- For now, we'll skip insert/update/delete policies