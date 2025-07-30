-- Test function to see what slugs would be generated
-- This can be run to preview slug generation before applying the migration

-- First, let's see what the current events look like
SELECT 
    id,
    title,
    location_city,
    location_state,
    event_start,
    -- Preview what the slug would look like
    lower(
        regexp_replace(
            array_to_string(
                (string_to_array(title, ' '))[1:4], 
                '-'
            ) || '-' || 
            COALESCE(location_city, (SELECT city FROM event_venues WHERE id = events.venue_id)) || '-' || 
            COALESCE(location_state, (SELECT state FROM event_venues WHERE id = events.venue_id)) || '-' ||
            to_char(event_start, 'month-yyyy'),
            '[^a-z0-9-]', 
            '', 
            'g'
        )
    ) as proposed_slug
FROM events
WHERE status = 'published'
ORDER BY event_start
LIMIT 10;