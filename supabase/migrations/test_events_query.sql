-- Test simple events query
SELECT 
    id,
    title,
    short_description,
    event_start,
    event_end,
    all_day,
    location_name,
    location_city,
    location_state,
    cost,
    cost_description,
    max_attendees,
    featured_image_url,
    is_featured,
    organizer_business_id
FROM events
WHERE event_visibility = 'public'
AND status = 'published'
AND approval_status = 'approved'
AND event_start >= '2025-07-02'::timestamp
ORDER BY event_start
LIMIT 5;