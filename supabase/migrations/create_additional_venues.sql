-- Create additional venues for the events that don't have them yet
INSERT INTO event_venues (name, address, city, state, zip_code, capacity, description, venue_type) 
SELECT * FROM (VALUES
  ('Miami Beach Convention Center', '1901 Convention Center Dr', 'Miami Beach', 'FL', '33139', 15000, 'Premier convention center hosting major boat shows and marine exhibitions', 'Convention Center'),
  ('Hawks Cay Resort Marina', '61 Hawks Cay Blvd', 'Duck Key', 'FL', '33050', 500, 'Luxury resort marina in the Florida Keys', 'Marina'),
  ('Bahia Mar Yachting Center', '801 Seabreeze Blvd', 'Fort Lauderdale', 'FL', '33316', 1000, 'Premier yachting destination with deep-water slips', 'Marina'),
  ('Biscayne Bay - Nixon Sandbar', 'Biscayne Bay', 'Miami', 'FL', '33139', 5000, 'Popular sandbar destination for boating gatherings', 'Sandbar'),
  ('Maritime Professional Training', '1915 S Andrews Ave', 'Fort Lauderdale', 'FL', '33316', 50, 'Professional maritime training facility', 'Training Center'),
  ('Davis Island Yacht Club', '1315 Severn Ave', 'Tampa', 'FL', '33606', 2000, 'Historic yacht club with racing facilities', 'Yacht Club'),
  ('St. Petersburg Marina', '300 2nd Ave SE', 'St. Petersburg', 'FL', '33701', 3000, 'Downtown marina with modern facilities', 'Marina'),
  ('MarineMax Fort Lauderdale', '2100 Marina Bay Dr E', 'Fort Lauderdale', 'FL', '33312', 1000, 'Premier boat dealership with demo facilities', 'Dealership')
) AS v(name, address, city, state, zip_code, capacity, description, venue_type)
WHERE NOT EXISTS (
  SELECT 1 FROM event_venues WHERE event_venues.name = v.name
);

-- Now link these venues to the events
UPDATE events
SET venue_id = (
  CASE 
    WHEN location_name = 'Miami Beach Convention Center' THEN (SELECT id FROM event_venues WHERE name = 'Miami Beach Convention Center' LIMIT 1)
    WHEN location_name = 'Hawks Cay Resort Marina' THEN (SELECT id FROM event_venues WHERE name = 'Hawks Cay Resort Marina' LIMIT 1)
    WHEN location_name = 'Bahia Mar Yachting Center' THEN (SELECT id FROM event_venues WHERE name = 'Bahia Mar Yachting Center' LIMIT 1)
    WHEN location_name = 'Biscayne Bay - Nixon Sandbar' THEN (SELECT id FROM event_venues WHERE name = 'Biscayne Bay - Nixon Sandbar' LIMIT 1)
    WHEN location_name = 'Maritime Professional Training' THEN (SELECT id FROM event_venues WHERE name = 'Maritime Professional Training' LIMIT 1)
    WHEN location_name = 'Davis Island Yacht Club' THEN (SELECT id FROM event_venues WHERE name = 'Davis Island Yacht Club' LIMIT 1)
    WHEN location_name = 'St. Petersburg Marina' THEN (SELECT id FROM event_venues WHERE name = 'St. Petersburg Marina' LIMIT 1)
    WHEN location_name = 'MarineMax Fort Lauderdale' THEN (SELECT id FROM event_venues WHERE name = 'MarineMax Fort Lauderdale' LIMIT 1)
    ELSE venue_id
  END
)
WHERE venue_id IS NULL AND location_name IN (
  'Miami Beach Convention Center',
  'Hawks Cay Resort Marina',
  'Bahia Mar Yachting Center',
  'Biscayne Bay - Nixon Sandbar',
  'Maritime Professional Training',
  'Davis Island Yacht Club',
  'St. Petersburg Marina',
  'MarineMax Fort Lauderdale'
);

-- Show the updated results
SELECT 
  e.id,
  e.title,
  e.location_name,
  v.name as venue_name,
  v.id as venue_id
FROM events e
LEFT JOIN event_venues v ON e.venue_id = v.id
WHERE e.status = 'published'
ORDER BY e.event_start
LIMIT 10;

-- Count how many events now have venues
SELECT 
  COUNT(*) as total_events,
  COUNT(venue_id) as events_with_venue,
  COUNT(*) - COUNT(venue_id) as events_without_venue
FROM events
WHERE status = 'published';