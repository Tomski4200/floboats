-- Seed Business Categories
INSERT INTO business_categories (id, name, description, parent_category_id, icon, color_hex, order_index) VALUES
-- Main Categories
('a1111111-1111-1111-1111-111111111111', 'Marinas & Docks', 'Boat storage, slips, and docking facilities', NULL, 'Anchor', '#1E40AF', 1),
('a2222222-2222-2222-2222-222222222222', 'Boat Dealers', 'New and used boat sales', NULL, 'ShoppingBag', '#DC2626', 2),
('a3333333-3333-3333-3333-333333333333', 'Service & Repair', 'Maintenance, repair, and technical services', NULL, 'Wrench', '#059669', 3),
('a4444444-4444-4444-4444-444444444444', 'Rentals & Charters', 'Boat rentals, charters, and tours', NULL, 'Ship', '#7C3AED', 4),
('a5555555-5555-5555-5555-555555555555', 'Marine Supplies', 'Parts, equipment, and accessories', NULL, 'Package', '#EA580C', 5),
('a6666666-6666-6666-6666-666666666666', 'Professional Services', 'Insurance, financing, and other services', NULL, 'Briefcase', '#0891B2', 6);

-- Subcategories for Marinas & Docks
INSERT INTO business_categories (id, name, description, parent_category_id, icon, order_index) VALUES
('b1111111-1111-1111-1111-111111111111', 'Full-Service Marinas', 'Complete marina facilities with amenities', 'a1111111-1111-1111-1111-111111111111', 'Building', 1),
('b1111111-2222-2222-2222-222222222222', 'Dry Storage', 'Indoor and outdoor dry storage facilities', 'a1111111-1111-1111-1111-111111111111', 'Warehouse', 2),
('b1111111-3333-3333-3333-333333333333', 'Boat Ramps', 'Public and private boat launch facilities', 'a1111111-1111-1111-1111-111111111111', 'TrendingDown', 3);

-- Subcategories for Service & Repair
INSERT INTO business_categories (id, name, description, parent_category_id, icon, order_index) VALUES
('b3333333-1111-1111-1111-111111111111', 'Engine Service', 'Outboard and inboard engine specialists', 'a3333333-3333-3333-3333-333333333333', 'Settings', 1),
('b3333333-2222-2222-2222-222222222222', 'Hull & Fiberglass', 'Hull repair and fiberglass work', 'a3333333-3333-3333-3333-333333333333', 'Shield', 2),
('b3333333-3333-3333-3333-333333333333', 'Electronics', 'Marine electronics installation and repair', 'a3333333-3333-3333-3333-333333333333', 'Cpu', 3),
('b3333333-4444-4444-4444-444444444444', 'Canvas & Upholstery', 'Custom canvas and upholstery services', 'a3333333-3333-3333-3333-333333333333', 'Scissors', 4);

-- Sample Business Data
INSERT INTO businesses (
    id, category_id, business_name, slug, description, short_description,
    phone, email, website_url, business_hours, address_line1, city, state, zip_code,
    coordinates, specialties, services_offered, verification_status, business_status
) VALUES
-- Marinas
(
    'c1111111-1111-1111-1111-111111111111',
    'b1111111-1111-1111-1111-111111111111',
    'Miami Beach Marina',
    'miami-beach-marina',
    'Premier full-service marina in the heart of Miami Beach, offering world-class facilities and services for boats up to 250 feet. Located minutes from South Beach and Biscayne Bay.',
    'Full-service marina with 400 slips, restaurants, and yacht services',
    '(305) 673-6000',
    'info@miamibeachmarina.com',
    'https://www.miamibeachmarina.com',
    '{"monday": {"open": "07:00", "close": "19:00"}, "tuesday": {"open": "07:00", "close": "19:00"}, "wednesday": {"open": "07:00", "close": "19:00"}, "thursday": {"open": "07:00", "close": "19:00"}, "friday": {"open": "07:00", "close": "20:00"}, "saturday": {"open": "07:00", "close": "20:00"}, "sunday": {"open": "07:00", "close": "18:00"}}',
    '300 Alton Road',
    'Miami Beach',
    'FL',
    '33139',
    POINT(-80.1867, 25.7907),
    ARRAY['Mega Yacht Services', 'Transient Slips', 'Long-term Storage'],
    ARRAY['Fuel Dock', 'Pump Out', 'Shore Power', 'WiFi', 'Laundry', 'Showers', 'Ice', 'Ship Store'],
    'verified',
    'active'
),
(
    'c1111111-2222-2222-2222-222222222222',
    'b1111111-1111-1111-1111-111111111111',
    'Fort Lauderdale Marina',
    'fort-lauderdale-marina',
    'Located in the "Yachting Capital of the World," Fort Lauderdale Marina offers deep water access and state-of-the-art facilities for vessels of all sizes.',
    'Deep water marina in downtown Fort Lauderdale',
    '(954) 468-0140',
    'marina@fortlauderdale.gov',
    'https://www.fortlauderdale.gov/marina',
    '{"monday": {"open": "08:00", "close": "17:00"}, "tuesday": {"open": "08:00", "close": "17:00"}, "wednesday": {"open": "08:00", "close": "17:00"}, "thursday": {"open": "08:00", "close": "17:00"}, "friday": {"open": "08:00", "close": "17:00"}, "saturday": {"open": "08:00", "close": "17:00"}, "sunday": {"open": "08:00", "close": "17:00"}}',
    '1401 Seabreeze Boulevard',
    'Fort Lauderdale',
    'FL',
    '33316',
    POINT(-80.1097, 26.1100),
    ARRAY['Deep Water Access', 'Downtown Location', 'Mega Yacht Capable'],
    ARRAY['Dockage', 'Electric', 'Water', 'Security', 'Restrooms', 'Parking'],
    'verified',
    'active'
),

-- Boat Dealers
(
    'c2222222-1111-1111-1111-111111111111',
    'a2222222-2222-2222-2222-222222222222',
    'MarineMax Fort Lauderdale',
    'marinemax-fort-lauderdale',
    'Florida''s premier boat dealer offering new and pre-owned boats from the world''s leading manufacturers including Sea Ray, Boston Whaler, and Azimut Yachts.',
    'Premier boat dealer with top brands and full service',
    '(954) 525-7272',
    'fortlauderdale@marinemax.com',
    'https://www.marinemax.com',
    '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "17:00"}, "sunday": {"open": "11:00", "close": "16:00"}}',
    '2300 South Federal Highway',
    'Fort Lauderdale',
    'FL',
    '33316',
    POINT(-80.1107, 26.0935),
    ARRAY['New Boat Sales', 'Pre-owned Sales', 'Trade-ins', 'Financing'],
    ARRAY['Sales', 'Service', 'Parts', 'Storage', 'Brokerage'],
    'verified',
    'active'
),
(
    'c2222222-2222-2222-2222-222222222222',
    'a2222222-2222-2222-2222-222222222222',
    'Tampa Bay Boat Sales',
    'tampa-bay-boat-sales',
    'Family-owned dealership specializing in fishing boats and center consoles. Authorized dealer for Grady-White, Yamaha, and Mercury.',
    'Fishing boat specialists in Tampa Bay',
    '(813) 885-5085',
    'sales@tampaboats.com',
    'https://www.tampaboatsales.com',
    '{"monday": {"open": "09:00", "close": "17:30"}, "tuesday": {"open": "09:00", "close": "17:30"}, "wednesday": {"open": "09:00", "close": "17:30"}, "thursday": {"open": "09:00", "close": "17:30"}, "friday": {"open": "09:00", "close": "17:30"}, "saturday": {"open": "09:00", "close": "16:00"}, "sunday": {"closed": true}}',
    '4815 West Gandy Boulevard',
    'Tampa',
    'FL',
    '33611',
    POINT(-82.5231, 27.8947),
    ARRAY['Fishing Boats', 'Center Consoles', 'Bay Boats', 'Offshore Boats'],
    ARRAY['New Sales', 'Used Sales', 'Service', 'Parts', 'Rigging'],
    'verified',
    'active'
),

-- Service & Repair
(
    'c3333333-1111-1111-1111-111111111111',
    'b3333333-1111-1111-1111-111111111111',
    'Keys Marine Service',
    'keys-marine-service',
    'Expert marine engine service and repair in the Florida Keys. Factory certified technicians for Mercury, Yamaha, Suzuki, and Honda outboards.',
    'Outboard engine specialists in the Keys',
    '(305) 743-8888',
    'service@keysmarineservice.com',
    'https://www.keysmarineservice.com',
    '{"monday": {"open": "08:00", "close": "17:00"}, "tuesday": {"open": "08:00", "close": "17:00"}, "wednesday": {"open": "08:00", "close": "17:00"}, "thursday": {"open": "08:00", "close": "17:00"}, "friday": {"open": "08:00", "close": "17:00"}, "saturday": {"open": "08:00", "close": "12:00"}, "sunday": {"closed": true}}',
    '11600 Overseas Highway',
    'Marathon',
    'FL',
    '33050',
    POINT(-81.0765, 24.7134),
    ARRAY['Outboard Service', 'Engine Rebuilds', 'Mobile Service', 'Emergency Repairs'],
    ARRAY['Diagnostics', 'Tune-ups', 'Lower Unit Service', 'Prop Repair', 'Parts'],
    'verified',
    'active'
),
(
    'c3333333-2222-2222-2222-222222222222',
    'b3333333-3333-3333-3333-333333333333',
    'Advanced Marine Electronics',
    'advanced-marine-electronics',
    'Professional installation and service of marine electronics including GPS, radar, autopilots, and communication systems. Certified installers for all major brands.',
    'Marine electronics installation and service',
    '(561) 842-5522',
    'info@advancedmarineelectronics.com',
    'https://www.ameelectronics.com',
    '{"monday": {"open": "08:00", "close": "17:00"}, "tuesday": {"open": "08:00", "close": "17:00"}, "wednesday": {"open": "08:00", "close": "17:00"}, "thursday": {"open": "08:00", "close": "17:00"}, "friday": {"open": "08:00", "close": "17:00"}, "saturday": {"closed": true}, "sunday": {"closed": true}}',
    '1000 North Flagler Drive',
    'West Palm Beach',
    'FL',
    '33401',
    POINT(-80.0481, 26.7208),
    ARRAY['GPS/Chartplotters', 'Radar Systems', 'Communication', 'Entertainment Systems'],
    ARRAY['Installation', 'Troubleshooting', 'Updates', 'Training', 'NMEA Networking'],
    'verified',
    'active'
),

-- Rentals & Charters
(
    'c4444444-1111-1111-1111-111111111111',
    'a4444444-4444-4444-4444-444444444444',
    'Sarasota Bay Charters',
    'sarasota-bay-charters',
    'Experience the best of Sarasota Bay with our fleet of fishing and pleasure boats. From sunset cruises to deep-sea fishing adventures.',
    'Charter fishing and boat tours in Sarasota',
    '(941) 365-2200',
    'captain@sarasotacharters.com',
    'https://www.sarasotabaycharters.com',
    '{"monday": {"open": "06:00", "close": "20:00"}, "tuesday": {"open": "06:00", "close": "20:00"}, "wednesday": {"open": "06:00", "close": "20:00"}, "thursday": {"open": "06:00", "close": "20:00"}, "friday": {"open": "06:00", "close": "20:00"}, "saturday": {"open": "06:00", "close": "20:00"}, "sunday": {"open": "06:00", "close": "20:00"}}',
    '2 Marina Plaza',
    'Sarasota',
    'FL',
    '34236',
    POINT(-82.5779, 27.3364),
    ARRAY['Fishing Charters', 'Sunset Cruises', 'Dolphin Tours', 'Private Charters'],
    ARRAY['Inshore Fishing', 'Offshore Fishing', 'Sightseeing', 'Special Events'],
    'verified',
    'active'
),
(
    'c4444444-2222-2222-2222-222222222222',
    'a4444444-4444-4444-4444-444444444444',
    'Naples Boat Rentals',
    'naples-boat-rentals',
    'Rent the perfect boat for exploring Naples and Marco Island waters. Pontoons, deck boats, and fishing boats available by the day or week.',
    'Self-drive boat rentals in Naples',
    '(239) 774-0100',
    'rentals@naplesboatrentals.com',
    'https://www.naplesboatrentals.com',
    '{"monday": {"open": "08:00", "close": "18:00"}, "tuesday": {"open": "08:00", "close": "18:00"}, "wednesday": {"open": "08:00", "close": "18:00"}, "thursday": {"open": "08:00", "close": "18:00"}, "friday": {"open": "08:00", "close": "18:00"}, "saturday": {"open": "08:00", "close": "18:00"}, "sunday": {"open": "08:00", "close": "18:00"}}',
    '1146 6th Avenue South',
    'Naples',
    'FL',
    '34102',
    POINT(-81.7948, 26.1281),
    ARRAY['Pontoon Boats', 'Deck Boats', 'Fishing Boats', 'Jet Skis'],
    ARRAY['Daily Rentals', 'Weekly Rentals', 'Guided Tours', 'Delivery Service'],
    'verified',
    'active'
),

-- Marine Supplies
(
    'c5555555-1111-1111-1111-111111111111',
    'a5555555-5555-5555-5555-555555555555',
    'West Marine Fort Myers',
    'west-marine-fort-myers',
    'Your local source for boating supplies, safety equipment, fishing gear, and marine electronics. Expert advice from boaters who know.',
    'Complete marine supply store',
    '(239) 433-1114',
    'store502@westmarine.com',
    'https://www.westmarine.com',
    '{"monday": {"open": "09:00", "close": "19:00"}, "tuesday": {"open": "09:00", "close": "19:00"}, "wednesday": {"open": "09:00", "close": "19:00"}, "thursday": {"open": "09:00", "close": "19:00"}, "friday": {"open": "09:00", "close": "19:00"}, "saturday": {"open": "08:00", "close": "18:00"}, "sunday": {"open": "09:00", "close": "17:00"}}',
    '14091 South Tamiami Trail',
    'Fort Myers',
    'FL',
    '33912',
    POINT(-81.8661, 26.5516),
    ARRAY['Safety Equipment', 'Electronics', 'Maintenance', 'Fishing Gear'],
    ARRAY['Retail Sales', 'Special Orders', 'Rigging Services', 'Installation'],
    'verified',
    'active'
),

-- Professional Services
(
    'c6666666-1111-1111-1111-111111111111',
    'a6666666-6666-6666-6666-666666666666',
    'Florida Marine Insurance Group',
    'florida-marine-insurance',
    'Specialized marine insurance for boats, yachts, and personal watercraft. Competitive rates and comprehensive coverage throughout Florida.',
    'Marine insurance specialists',
    '(800) 555-BOAT',
    'quotes@floridamarineinsurance.com',
    'https://www.floridamarineinsurance.com',
    '{"monday": {"open": "09:00", "close": "17:00"}, "tuesday": {"open": "09:00", "close": "17:00"}, "wednesday": {"open": "09:00", "close": "17:00"}, "thursday": {"open": "09:00", "close": "17:00"}, "friday": {"open": "09:00", "close": "17:00"}, "saturday": {"closed": true}, "sunday": {"closed": true}}',
    '100 2nd Avenue South',
    'St. Petersburg',
    'FL',
    '33701',
    POINT(-82.6403, 27.7703),
    ARRAY['Boat Insurance', 'Yacht Insurance', 'PWC Insurance', 'Commercial Marine'],
    ARRAY['Coverage Quotes', 'Claims Service', 'Risk Assessment', 'Policy Review'],
    'verified',
    'active'
);

-- Add some marina-specific details
INSERT INTO marina_details (
    business_id, slip_count, max_vessel_length, max_vessel_draft, fuel_types,
    has_fuel_dock, has_pump_out, has_haul_out, has_boat_ramp, has_dry_storage,
    amenities
) VALUES
(
    'c1111111-1111-1111-1111-111111111111',
    400,
    250,
    12,
    ARRAY['Gas', 'Diesel'],
    true,
    true,
    false,
    false,
    false,
    '{"wifi": true, "showers": true, "laundry": true, "restaurant": true, "bar": true, "pool": true, "fitness": true, "ship_store": true, "concierge": true}'
),
(
    'c1111111-2222-2222-2222-222222222222',
    250,
    300,
    15,
    ARRAY['Gas', 'Diesel'],
    true,
    true,
    true,
    true,
    false,
    '{"wifi": true, "showers": true, "laundry": true, "restaurant": false, "bar": false, "pool": false, "fitness": false, "ship_store": true, "security": true}'
);

-- Add some business photos
INSERT INTO business_photos (business_id, photo_url, caption, photo_type, is_primary, order_index) VALUES
('c1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5', 'Miami Beach Marina aerial view', 'exterior', true, 1),
('c1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1590012314607-cda9d9b699ae', 'Marina docks at sunset', 'exterior', false, 2),
('c2222222-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a', 'MarineMax showroom', 'interior', true, 1),
('c3333333-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64', 'Engine service bay', 'interior', true, 1),
('c4444444-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1605281317010-fe5ffe798166', 'Charter fishing boat', 'products', true, 1),
('c5555555-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96', 'Marine supply store interior', 'interior', true, 1);

-- Add some sample reviews
INSERT INTO business_reviews (
    business_id, reviewer_id, rating, title, review_text,
    service_date, would_recommend, helpful_votes
) VALUES
(
    'c1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111', -- This should be a real user ID
    5,
    'Excellent marina with top-notch facilities',
    'Been keeping my boat here for 3 years. The staff is professional, facilities are always clean, and the location cant be beat. Walking distance to restaurants and shops.',
    '2024-12-15',
    true,
    12
),
(
    'c2222222-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111', -- This should be a real user ID
    4,
    'Great selection and knowledgeable staff',
    'Bought my SeaRay here last year. Sales team was helpful without being pushy. Service department has been great for routine maintenance.',
    '2024-11-20',
    true,
    8
);