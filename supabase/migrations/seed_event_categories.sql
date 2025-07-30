-- Seed Event Categories for FloBoats

INSERT INTO event_categories (name, description, color_hex, icon, order_index) VALUES
    ('Boat Shows', 'Major boat shows and marine exhibitions', '#3B82F6', 'anchor', 1),
    ('Fishing Tournaments', 'Competitive fishing events and tournaments', '#10B981', 'fish', 2),
    ('Regattas & Races', 'Sailing races and powerboat competitions', '#F59E0B', 'flag', 3),
    ('Marina Events', 'Events hosted at marinas and yacht clubs', '#8B5CF6', 'building', 4),
    ('Educational', 'Boating safety courses and workshops', '#6366F1', 'graduation-cap', 5),
    ('Social & Meetups', 'Boating community gatherings and social events', '#EC4899', 'users', 6),
    ('Charity & Fundraisers', 'Charitable events in the marine community', '#14B8A6', 'heart', 7),
    ('Demo Days', 'Boat demonstrations and sea trials', '#F97316', 'ship', 8),
    ('Maintenance & DIY', 'Workshops on boat maintenance and repairs', '#84CC16', 'wrench', 9),
    ('Other', 'Other marine-related events', '#6B7280', 'calendar', 10);

-- Sample venues for testing
INSERT INTO event_venues (name, address_line1, city, state, zip_code, venue_type, capacity) VALUES
    ('Miami Beach Convention Center', '1901 Convention Center Dr', 'Miami Beach', 'FL', '33139', 'convention_center', 5000),
    ('Bahia Mar Yachting Center', '801 Seabreeze Blvd', 'Fort Lauderdale', 'FL', '33316', 'marina', 1000),
    ('Tampa Convention Center', '333 S Franklin St', 'Tampa', 'FL', '33602', 'convention_center', 3000),
    ('Key West Historic Seaport', '631 Greene St', 'Key West', 'FL', '33040', 'marina', 500),
    ('St. Petersburg Marina', '300 2nd Ave SE', 'St. Petersburg', 'FL', '33701', 'marina', 800);