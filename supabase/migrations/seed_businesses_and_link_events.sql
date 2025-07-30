-- Seed Businesses and Link to Events
-- This creates event-organizing businesses and updates events to reference them

-- First, check if we have the Event Organizer category
INSERT INTO business_categories (name, description, icon, color_hex, order_index, parent_category_id)
VALUES ('Event Organizer', 'Companies and organizations that host marine events', 'calendar', '#9333EA', 100, NULL)
ON CONFLICT (name) DO NOTHING;

-- Create fake businesses that organize events
INSERT INTO businesses (
    business_name,
    slug,
    description,
    short_description,
    phone,
    email,
    website_url,
    address_line1,
    city,
    state,
    zip_code,
    business_hours,
    business_status,
    listing_status,
    verification_status,
    is_premium,
    average_rating,
    review_count,
    established_year,
    employee_count_range,
    specialties,
    services_offered
) VALUES
(
    'Miami International Boat Show LLC',
    'miami-international-boat-show-llc-miami-fl',
    'The premier boat show organization in South Florida, producing world-class marine exhibitions and events. We bring together manufacturers, dealers, and boating enthusiasts for unforgettable experiences.',
    'Premier boat show organization in South Florida',
    '305-555-0100',
    'info@miamiboatshow.com',
    'https://miamiboatshow.com',
    '1901 Convention Center Dr',
    'Miami Beach',
    'FL',
    '33139',
    '{"monday": {"open": "09:00", "close": "17:00"}, "tuesday": {"open": "09:00", "close": "17:00"}, "wednesday": {"open": "09:00", "close": "17:00"}, "thursday": {"open": "09:00", "close": "17:00"}, "friday": {"open": "09:00", "close": "17:00"}, "saturday": {"closed": true}, "sunday": {"closed": true}}'::jsonb,
    'active',
    'published',
    'verified',
    true,
    4.8,
    156,
    1985,
    '11-50',
    ARRAY['Boat Shows', 'Marine Exhibitions', 'Trade Shows'],
    ARRAY['Event Planning', 'Exhibition Management', 'Vendor Coordination', 'Marketing']
),
(
    'Florida Keys Fishing Tournaments Inc',
    'florida-keys-fishing-tournaments-inc-marathon-fl',
    'Organizing competitive fishing tournaments throughout the Florida Keys for over 30 years. We specialize in tarpon, bonefish, and permit tournaments with professional management and substantial prize pools.',
    'Premier fishing tournament organizers in the Keys',
    '305-555-0200',
    'tournaments@keysfishing.com',
    'https://keysfishingtournaments.com',
    '2400 Overseas Hwy',
    'Marathon',
    'FL',
    '33050',
    '{"monday": {"open": "08:00", "close": "18:00"}, "tuesday": {"open": "08:00", "close": "18:00"}, "wednesday": {"open": "08:00", "close": "18:00"}, "thursday": {"open": "08:00", "close": "18:00"}, "friday": {"open": "08:00", "close": "18:00"}, "saturday": {"open": "08:00", "close": "12:00"}, "sunday": {"closed": true}}'::jsonb,
    'active',
    'published',
    'verified',
    false,
    4.6,
    89,
    1992,
    '1-10',
    ARRAY['Fishing Tournaments', 'Competition Management', 'Prize Coordination'],
    ARRAY['Tournament Planning', 'Registration Management', 'Awards Ceremonies', 'Captain Meetings']
),
(
    'Tampa Bay Sailing Association',
    'tampa-bay-sailing-association-tampa-fl',
    'The leading sailing organization in Tampa Bay, hosting regattas, races, and sailing education programs. We promote the sport of sailing through competitive events and community engagement.',
    'Tampa Bay''s premier sailing organization',
    '813-555-0300',
    'race@tampabaysailing.org',
    'https://tampabaysailing.org',
    '333 S Franklin St',
    'Tampa',
    'FL',
    '33602',
    '{"monday": {"open": "10:00", "close": "18:00"}, "tuesday": {"open": "10:00", "close": "18:00"}, "wednesday": {"open": "10:00", "close": "18:00"}, "thursday": {"open": "10:00", "close": "18:00"}, "friday": {"open": "10:00", "close": "20:00"}, "saturday": {"open": "09:00", "close": "17:00"}, "sunday": {"open": "12:00", "close": "17:00"}}'::jsonb,
    'active',
    'published',
    'verified',
    false,
    4.7,
    124,
    1978,
    '11-50',
    ARRAY['Sailing Regattas', 'Racing Events', 'Sailing Education'],
    ARRAY['Race Management', 'Sailing Instruction', 'Event Coordination', 'Awards Dinners']
),
(
    'Bahia Mar Marina Events',
    'bahia-mar-marina-events-fort-lauderdale-fl',
    'The event planning division of Bahia Mar Yachting Center, specializing in waterfront events, festivals, and marine gatherings. From intimate sunset dinners to large-scale boat shows.',
    'Waterfront event specialists at Bahia Mar',
    '954-555-0400',
    'events@bahiamar.com',
    'https://bahiamar.com/events',
    '801 Seabreeze Blvd',
    'Fort Lauderdale',
    'FL',
    '33316',
    '{"monday": {"open": "08:00", "close": "20:00"}, "tuesday": {"open": "08:00", "close": "20:00"}, "wednesday": {"open": "08:00", "close": "20:00"}, "thursday": {"open": "08:00", "close": "20:00"}, "friday": {"open": "08:00", "close": "22:00"}, "saturday": {"open": "08:00", "close": "22:00"}, "sunday": {"open": "08:00", "close": "20:00"}}'::jsonb,
    'active',
    'published',
    'verified',
    true,
    4.9,
    203,
    1987,
    '51-200',
    ARRAY['Marina Events', 'Waterfront Festivals', 'Live Entertainment'],
    ARRAY['Event Planning', 'Venue Management', 'Catering Coordination', 'Entertainment Booking']
),
(
    'Maritime Professional Training',
    'maritime-professional-training-st-petersburg-fl',
    'Leading provider of USCG captain''s license courses and maritime education in Florida. We offer comprehensive training programs for recreational and professional mariners.',
    'USCG license training and maritime education',
    '727-555-0500',
    'training@mptusa.com',
    'https://mptusa.com',
    '300 2nd Ave SE',
    'St. Petersburg',
    'FL',
    '33701',
    '{"monday": {"open": "08:00", "close": "17:00"}, "tuesday": {"open": "08:00", "close": "17:00"}, "wednesday": {"open": "08:00", "close": "17:00"}, "thursday": {"open": "08:00", "close": "17:00"}, "friday": {"open": "08:00", "close": "17:00"}, "saturday": {"open": "09:00", "close": "13:00"}, "sunday": {"closed": true}}'::jsonb,
    'active',
    'published',
    'verified',
    false,
    4.9,
    412,
    1999,
    '1-10',
    ARRAY['Captain License Training', 'Maritime Education', 'Safety Courses'],
    ARRAY['OUPV Training', 'Master License Courses', 'Safety Seminars', 'Navigation Training']
),
(
    'Florida Boaters Network',
    'florida-boaters-network-miami-fl',
    'A community-driven organization that brings Florida boaters together through social events, raft-ups, and educational gatherings. Building connections on the water since 2010.',
    'Connecting Florida''s boating community',
    '305-555-0600',
    'connect@floridaboaters.net',
    'https://floridaboaters.net',
    '1234 Biscayne Blvd',
    'Miami',
    'FL',
    '33132',
    '{"monday": {"open": "10:00", "close": "18:00"}, "tuesday": {"open": "10:00", "close": "18:00"}, "wednesday": {"open": "10:00", "close": "18:00"}, "thursday": {"open": "10:00", "close": "18:00"}, "friday": {"open": "10:00", "close": "18:00"}, "saturday": {"open": "10:00", "close": "14:00"}, "sunday": {"closed": true}}'::jsonb,
    'active',
    'published',
    'verified',
    false,
    4.5,
    67,
    2010,
    '1-10',
    ARRAY['Social Events', 'Raft-ups', 'Community Building'],
    ARRAY['Event Organization', 'Social Media Management', 'Community Outreach', 'Newsletter']
),
(
    'MarineMax Events Division',
    'marinemax-events-division-fort-lauderdale-fl',
    'The special events team at MarineMax, organizing boat demos, sea trials, and customer appreciation events throughout Florida. Experience the latest models in a fun, relaxed atmosphere.',
    'Boat demos and customer events by MarineMax',
    '954-555-0700',
    'events@marinemax.com',
    'https://marinemax.com/events',
    '2300 W State Road 84',
    'Fort Lauderdale',
    'FL',
    '33312',
    '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "17:00"}, "sunday": {"open": "11:00", "close": "17:00"}}'::jsonb,
    'active',
    'published',
    'verified',
    true,
    4.7,
    198,
    2003,
    '201-500',
    ARRAY['Demo Days', 'Sea Trials', 'Customer Events'],
    ARRAY['Boat Demonstrations', 'Customer Events', 'Product Launches', 'VIP Experiences']
),
(
    'Key West Fishing Foundation',
    'key-west-fishing-foundation-key-west-fl',
    'Non-profit organization dedicated to youth fishing education and conservation in the Florida Keys. We organize free fishing clinics and family-friendly tournaments.',
    'Youth fishing education in the Keys',
    '305-555-0800',
    'kids@kwfishingfoundation.org',
    'https://kwfishingfoundation.org',
    '631 Greene St',
    'Key West',
    'FL',
    '33040',
    '{"monday": {"open": "09:00", "close": "17:00"}, "tuesday": {"open": "09:00", "close": "17:00"}, "wednesday": {"open": "09:00", "close": "17:00"}, "thursday": {"open": "09:00", "close": "17:00"}, "friday": {"open": "09:00", "close": "17:00"}, "saturday": {"open": "08:00", "close": "12:00"}, "sunday": {"closed": true}}'::jsonb,
    'active',
    'published',
    'verified',
    false,
    4.9,
    234,
    2005,
    '1-10',
    ARRAY['Youth Education', 'Fishing Clinics', 'Conservation'],
    ARRAY['Kids Fishing Programs', 'Educational Workshops', 'Conservation Events', 'Family Tournaments']
),
(
    'Sarasota Bay Celebrations',
    'sarasota-bay-celebrations-sarasota-fl',
    'Organizing Sarasota''s premier waterfront events including the annual July 4th boat parade, holiday flotillas, and seasonal celebrations on the bay.',
    'Sarasota''s waterfront event specialists',
    '941-555-0900',
    'celebrate@sarasotabay.com',
    'https://sarasotabaycelebrations.com',
    '2 Marina Plaza',
    'Sarasota',
    'FL',
    '34236',
    '{"monday": {"open": "09:00", "close": "17:00"}, "tuesday": {"open": "09:00", "close": "17:00"}, "wednesday": {"open": "09:00", "close": "17:00"}, "thursday": {"open": "09:00", "close": "17:00"}, "friday": {"open": "09:00", "close": "17:00"}, "saturday": {"closed": true}, "sunday": {"closed": true}}'::jsonb,
    'active',
    'published',
    'verified',
    true,
    4.8,
    145,
    1995,
    '1-10',
    ARRAY['Holiday Events', 'Boat Parades', 'Fireworks Shows'],
    ARRAY['Event Planning', 'Parade Coordination', 'Fireworks Displays', 'Community Outreach']
),
(
    'Women on the Water Florida',
    'women-on-the-water-florida-st-petersburg-fl',
    'Empowering women through boating education and hands-on training. We organize workshops, seminars, and networking events specifically designed for women in the marine industry.',
    'Empowering women through boating education',
    '727-555-1000',
    'info@womenonthewater.org',
    'https://womenonthewaterfl.org',
    '400 2nd Ave NE',
    'St. Petersburg',
    'FL',
    '33701',
    '{"monday": {"open": "10:00", "close": "18:00"}, "tuesday": {"open": "10:00", "close": "18:00"}, "wednesday": {"open": "10:00", "close": "18:00"}, "thursday": {"open": "10:00", "close": "18:00"}, "friday": {"open": "10:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "14:00"}, "sunday": {"closed": true}}'::jsonb,
    'active',
    'published',
    'verified',
    false,
    5.0,
    178,
    2015,
    '1-10',
    ARRAY['Women''s Education', 'Boating Workshops', 'Networking'],
    ARRAY['Hands-on Training', 'Safety Workshops', 'Networking Events', 'Mentorship Programs']
);

-- Now update the events to reference these businesses
UPDATE events SET organizer_business_id = (
    SELECT id FROM businesses WHERE slug = 'miami-international-boat-show-llc-miami-fl'
) WHERE title = 'Miami International Boat Show Summer Preview';

UPDATE events SET organizer_business_id = (
    SELECT id FROM businesses WHERE slug = 'florida-keys-fishing-tournaments-inc-marathon-fl'
) WHERE title = 'Keys Slam Fishing Tournament';

UPDATE events SET organizer_business_id = (
    SELECT id FROM businesses WHERE slug = 'tampa-bay-sailing-association-tampa-fl'
) WHERE title = 'Tampa Bay Lightning Regatta';

UPDATE events SET organizer_business_id = (
    SELECT id FROM businesses WHERE slug = 'bahia-mar-marina-events-fort-lauderdale-fl'
) WHERE title = 'Sunset Jazz & BBQ at the Marina';

UPDATE events SET organizer_business_id = (
    SELECT id FROM businesses WHERE slug = 'maritime-professional-training-st-petersburg-fl'
) WHERE title = 'USCG Captain''s License Course';

UPDATE events SET organizer_business_id = (
    SELECT id FROM businesses WHERE slug = 'florida-boaters-network-miami-fl'
) WHERE title = 'Full Moon Raft-Up Party';

UPDATE events SET organizer_business_id = (
    SELECT id FROM businesses WHERE slug = 'marinemax-events-division-fort-lauderdale-fl'
) WHERE title = 'Sea Ray Demo Days';

UPDATE events SET organizer_business_id = (
    SELECT id FROM businesses WHERE slug = 'key-west-fishing-foundation-key-west-fl'
) WHERE title = 'Kids Fishing Clinic & Tournament';

UPDATE events SET organizer_business_id = (
    SELECT id FROM businesses WHERE slug = 'sarasota-bay-celebrations-sarasota-fl'
) WHERE title = 'Independence Day Boat Parade & Fireworks';

UPDATE events SET organizer_business_id = (
    SELECT id FROM businesses WHERE slug = 'women-on-the-water-florida-st-petersburg-fl'
) WHERE title = 'Women''s Intro to Boating Workshop';

-- Create business-to-category links for all the event organizer businesses
INSERT INTO business_to_category_links (business_id, category_id)
SELECT b.id, c.id
FROM businesses b
CROSS JOIN business_categories c
WHERE c.name = 'Event Organizer'
AND b.slug IN (
    'miami-international-boat-show-llc-miami-fl',
    'florida-keys-fishing-tournaments-inc-marathon-fl',
    'tampa-bay-sailing-association-tampa-fl',
    'bahia-mar-marina-events-fort-lauderdale-fl',
    'maritime-professional-training-st-petersburg-fl',
    'florida-boaters-network-miami-fl',
    'marinemax-events-division-fort-lauderdale-fl',
    'key-west-fishing-foundation-key-west-fl',
    'sarasota-bay-celebrations-sarasota-fl',
    'women-on-the-water-florida-st-petersburg-fl'
)
ON CONFLICT (business_id, category_id) DO NOTHING;

-- Verify the updates
SELECT 
    e.title as event_title,
    b.business_name as organizer_name,
    b.slug as organizer_slug
FROM events e
LEFT JOIN businesses b ON e.organizer_business_id = b.id
ORDER BY e.event_start;