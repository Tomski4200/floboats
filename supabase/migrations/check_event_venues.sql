-- Check if events have venue_id set
SELECT 
  e.id,
  e.title,
  e.venue_id,
  e.location_name,
  v.name as venue_name
FROM events e
LEFT JOIN event_venues v ON e.venue_id = v.id
WHERE e.status = 'published'
LIMIT 10;

-- Count how many events have venues
SELECT 
  COUNT(*) as total_events,
  COUNT(venue_id) as events_with_venue,
  COUNT(*) - COUNT(venue_id) as events_without_venue
FROM events
WHERE status = 'published';

-- Check a specific event
SELECT 
  id,
  title,
  venue_id,
  location_name,
  location_city
FROM events
WHERE id = '761d92b5-dd5a-4792-bb24-c56a54e72167';