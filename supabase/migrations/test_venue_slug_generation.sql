-- Test function to see what venue slugs would be generated
-- This can be run to preview slug generation before applying the migration

-- Show what the current venues look like and what their slugs would be
SELECT 
    id,
    name,
    city,
    state,
    -- Preview what the slug would look like
    lower(
        regexp_replace(
            name || '-' || city || '-' || state,
            '[^a-z0-9-]', 
            '', 
            'g'
        )
    ) as proposed_slug
FROM event_venues
ORDER BY name
LIMIT 20;