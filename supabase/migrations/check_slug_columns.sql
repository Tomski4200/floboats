-- Check if slug columns exist and have data

-- Check events table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name = 'slug';

-- Check event_venues table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'event_venues' 
AND column_name = 'slug';

-- Show sample of events with slugs
SELECT 
    id,
    title,
    slug,
    event_start,
    status
FROM events
WHERE status = 'published'
ORDER BY event_start
LIMIT 5;

-- Show sample of venues with slugs
SELECT 
    id,
    name,
    city,
    state,
    slug
FROM event_venues
ORDER BY name
LIMIT 5;

-- Count events and venues with/without slugs
SELECT 
    'events' as table_name,
    COUNT(*) as total_rows,
    COUNT(slug) as rows_with_slug,
    COUNT(*) - COUNT(slug) as rows_without_slug
FROM events
WHERE status = 'published'
UNION ALL
SELECT 
    'event_venues' as table_name,
    COUNT(*) as total_rows,
    COUNT(slug) as rows_with_slug,
    COUNT(*) - COUNT(slug) as rows_without_slug
FROM event_venues;