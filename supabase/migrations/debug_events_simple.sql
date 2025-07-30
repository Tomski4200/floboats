-- Simple Debug Queries - Run each separately

-- 1. Check if events table has RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'events';

-- 2. Count total events
SELECT COUNT(*) as total_events FROM events;

-- 3. Check event visibility settings
SELECT 
    event_visibility,
    status,
    approval_status,
    COUNT(*) as count
FROM events
GROUP BY event_visibility, status, approval_status;

-- 4. Show first 5 events with their status
SELECT 
    title,
    event_visibility,
    status,
    approval_status,
    event_start
FROM events
LIMIT 5;

-- 5. Count events that should be visible
SELECT COUNT(*) as should_be_visible
FROM events 
WHERE event_visibility = 'public' 
AND status = 'published' 
AND approval_status = 'approved'
AND event_start >= NOW();

-- 6. Quick fix - If all looks good but RLS is blocking, add this temporary policy:
DROP POLICY IF EXISTS "Temporary - All events visible" ON events;
CREATE POLICY "Temporary - All events visible" 
    ON events FOR SELECT 
    USING (true);