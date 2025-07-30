-- Check why events aren't visible

-- 1. Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'events';

-- 2. Check the visibility/status of your events
SELECT 
    title,
    event_visibility,
    status,
    approval_status,
    event_start > NOW() as is_future_event
FROM events
ORDER BY created_at DESC
LIMIT 10;

-- 3. Count events by their visibility criteria
SELECT 
    COUNT(*) as total_events,
    COUNT(CASE WHEN event_visibility = 'public' THEN 1 END) as public_events,
    COUNT(CASE WHEN status = 'published' THEN 1 END) as published_events,
    COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved_events,
    COUNT(CASE WHEN event_start >= NOW() THEN 1 END) as future_events,
    COUNT(CASE WHEN event_visibility = 'public' 
               AND status = 'published' 
               AND approval_status = 'approved' 
               AND event_start >= NOW() THEN 1 END) as should_be_visible
FROM events;

-- 4. Show current RLS policies
SELECT 
    policyname,
    cmd,
    qual as condition
FROM pg_policies 
WHERE tablename = 'events';

-- 5. If RLS is the issue, temporarily disable it (ONLY FOR TESTING!)
-- Uncomment the line below to disable RLS temporarily:
-- ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- 6. Or create a more permissive policy
DROP POLICY IF EXISTS "Public events are viewable by everyone" ON events;
CREATE POLICY "Public events are viewable by everyone" 
    ON events FOR SELECT 
    USING (true);  -- This makes ALL events visible temporarily