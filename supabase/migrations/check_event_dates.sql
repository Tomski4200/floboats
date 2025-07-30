-- Check event dates and timezone issues

-- 1. Show current time in database
SELECT 
    NOW() as db_current_time,
    NOW() AT TIME ZONE 'America/New_York' as db_time_in_et;

-- 2. Check your events and their dates
SELECT 
    title,
    event_start,
    event_start AT TIME ZONE 'America/New_York' as event_start_et,
    event_start > NOW() as is_future,
    event_visibility,
    status,
    approval_status
FROM events
ORDER BY event_start;

-- 3. The exact query your app is using
SELECT COUNT(*) as matching_events
FROM events
WHERE event_visibility = 'public'
AND status = 'published'
AND approval_status = 'approved'
AND event_start >= NOW();

-- 4. Check without the date filter
SELECT COUNT(*) as matching_events_no_date_filter
FROM events
WHERE event_visibility = 'public'
AND status = 'published'
AND approval_status = 'approved';