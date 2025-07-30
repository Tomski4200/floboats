-- Debug Events Visibility

-- 1. Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'events';

-- 2. Check what events exist
SELECT 
    id,
    title,
    event_visibility,
    status,
    approval_status,
    event_start,
    created_at
FROM events
ORDER BY created_at DESC;

-- 3. Check RLS policies on events table
SELECT 
    policyname as policy_name,
    cmd as command,
    roles,
    qual as policy_condition
FROM pg_policies 
WHERE tablename = 'events';

-- 4. Test if we can see events without RLS (as admin)
SELECT COUNT(*) as total_events FROM events;

SELECT COUNT(*) as public_published_approved_events 
FROM events 
WHERE event_visibility = 'public' 
AND status = 'published' 
AND approval_status = 'approved';

-- 5. Check if event_categories relationship works
SELECT 
    e.title,
    ec.name as category_name
FROM events e
LEFT JOIN event_categories ec ON e.category_id = ec.id
LIMIT 5;

-- 6. If RLS is blocking, temporarily disable it for testing
-- CAUTION: Only for debugging, re-enable after!
-- ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- 7. Alternative: Create a more permissive policy for testing
DROP POLICY IF EXISTS "Temporary - All events visible" ON events;
CREATE POLICY "Temporary - All events visible" 
    ON events FOR SELECT 
    USING (true);