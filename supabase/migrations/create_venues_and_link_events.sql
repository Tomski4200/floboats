-- Create some popular Florida marine venues
INSERT INTO event_venues (name, address, city, state, zip_code, capacity, description, venue_type) VALUES
('Sarasota Bay', '1 Marina Plaza', 'Sarasota', 'FL', '34236', 5000, 'Beautiful waterfront venue perfect for boat parades and water events', 'Waterfront'),
('Miami Marine Stadium', '3501 Rickenbacker Causeway', 'Miami', 'FL', '33149', 6000, 'Historic marine stadium venue for boat races and water sports events', 'Stadium'),
('Key West Harbor', '100 Grinnell St', 'Key West', 'FL', '33040', 3000, 'Scenic harbor venue ideal for maritime festivals and boat shows', 'Harbor'),
('Fort Lauderdale Beach', '1100 Seabreeze Blvd', 'Fort Lauderdale', 'FL', '33316', 10000, 'Popular beach venue for marine events and water sports', 'Beach'),
('Tampa Convention Center', '333 S Franklin St', 'Tampa', 'FL', '33602', 2000, 'Modern convention center with waterfront access', 'Convention Center'),
('Naples Pier', '25 12th Ave S', 'Naples', 'FL', '34102', 1000, 'Historic pier venue perfect for fishing tournaments and sunset events', 'Pier')
ON CONFLICT (name) DO NOTHING;

-- Get the venue IDs
WITH venue_mapping AS (
  SELECT id, name, city FROM event_venues
)
-- Update events to use the appropriate venues based on location_name
UPDATE events 
SET venue_id = vm.id
FROM venue_mapping vm
WHERE events.venue_id IS NULL
  AND (
    (events.location_name ILIKE '%Sarasota Bay%' AND vm.name = 'Sarasota Bay')
    OR (events.location_name ILIKE '%Miami Marine Stadium%' AND vm.name = 'Miami Marine Stadium')
    OR (events.location_name ILIKE '%Key West%' AND vm.name = 'Key West Harbor')
    OR (events.location_name ILIKE '%Fort Lauderdale%' AND vm.name = 'Fort Lauderdale Beach')
    OR (events.location_name ILIKE '%Tampa%' AND vm.name = 'Tampa Convention Center')
    OR (events.location_name ILIKE '%Naples%' AND vm.name = 'Naples Pier')
  );

-- For the specific event we know about
UPDATE events 
SET venue_id = (SELECT id FROM event_venues WHERE name = 'Sarasota Bay' LIMIT 1)
WHERE id = '761d92b5-dd5a-4792-bb24-c56a54e72167';

-- Show the results
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