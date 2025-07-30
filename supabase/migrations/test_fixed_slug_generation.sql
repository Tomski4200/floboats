-- Test the fixed slug generation

-- Show venue slug examples
SELECT 
    name,
    city,
    state,
    -- Show the step-by-step transformation
    name || ' ' || city || ' ' || state as "Combined",
    regexp_replace(name || ' ' || city || ' ' || state, '[^a-zA-Z0-9]+', '-', 'g') as "After regex",
    lower(regexp_replace(name || ' ' || city || ' ' || state, '[^a-zA-Z0-9]+', '-', 'g')) as "After lowercase",
    trim(both '-' from regexp_replace(lower(regexp_replace(name || ' ' || city || ' ' || state, '[^a-zA-Z0-9]+', '-', 'g')), '-+', '-', 'g')) as "Final slug"
FROM event_venues
WHERE name IN ('Biscayne Bay - Nixon Sandbar', 'Tampa Convention Center')
LIMIT 5;

-- Show event slug examples
SELECT 
    title,
    location_city,
    event_start,
    -- Show what the slug would look like
    trim(both '-' from regexp_replace(
        lower(
            regexp_replace(
                array_to_string((string_to_array(title, ' '))[1:4], ' ') || ' ' || 
                COALESCE(location_city, 'Unknown') || ' ' || 
                COALESCE(location_state, 'FL') || ' ' ||
                to_char(event_start, 'Month YYYY'),
                '[^a-zA-Z0-9]+', 
                '-', 
                'g'
            )
        ), 
        '-+', 
        '-', 
        'g'
    )) as "Proposed slug"
FROM events
WHERE title LIKE 'Independence Day%'
LIMIT 5;