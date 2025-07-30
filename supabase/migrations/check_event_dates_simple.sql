-- Simple check of event dates
SELECT 
    id,
    title,
    event_start,
    event_start > '2025-07-02'::timestamp as is_future,
    event_visibility,
    status,
    approval_status
FROM events
ORDER BY event_start
LIMIT 10;