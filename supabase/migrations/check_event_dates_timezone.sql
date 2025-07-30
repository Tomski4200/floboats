-- Check timezone and date issues

-- 1. Current time in different formats
SELECT 
    NOW() as db_now,
    NOW() AT TIME ZONE 'UTC' as utc_time,
    NOW() AT TIME ZONE 'America/New_York' as et_time,
    '2025-07-02'::timestamp as july_2_2025;

-- 2. Check your event dates
SELECT 
    title,
    event_start,
    event_start AT TIME ZONE 'UTC' as event_start_utc,
    event_start > NOW() as is_future,
    event_start > '2025-07-02'::timestamp as is_after_july_2
FROM events
ORDER BY event_start
LIMIT 5;

-- 3. Count events by date comparison
SELECT 
    COUNT(*) as total_events,
    COUNT(CASE WHEN event_start > NOW() THEN 1 END) as future_from_now,
    COUNT(CASE WHEN event_start > '2025-07-02'::timestamp THEN 1 END) as after_july_2,
    COUNT(CASE WHEN event_start >= '2025-07-03'::timestamp THEN 1 END) as july_3_or_later
FROM events
WHERE event_visibility = 'public'
AND status = 'published'
AND approval_status = 'approved';