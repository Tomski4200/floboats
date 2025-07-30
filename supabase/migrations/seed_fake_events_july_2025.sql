-- Seed Fake Events for July 2025
-- This requires that you have already run:
-- 1. create_events_schema.sql
-- 2. seed_event_categories.sql
-- 3. Have some businesses in your database

-- First, let's get some business IDs to use as organizers
-- You'll need to replace these with actual business IDs from your database
-- Run this query first to get some business IDs:
-- SELECT id, business_name FROM businesses LIMIT 10;

-- For this seed file, I'll use placeholder UUIDs that you'll need to replace
-- Replace these with actual IDs from your businesses table:
-- Example: 'REPLACE-WITH-MARINA-BUSINESS-ID'
-- Example: 'REPLACE-WITH-DEALER-BUSINESS-ID'

-- Get category IDs (these should exist after running seed_event_categories.sql)
DO $$
DECLARE
  boat_shows_id UUID;
  fishing_tournaments_id UUID;
  regattas_id UUID;
  marina_events_id UUID;
  educational_id UUID;
  social_id UUID;
  demo_days_id UUID;
  
  -- Venue IDs
  miami_convention_id UUID;
  bahia_mar_id UUID;
  tampa_convention_id UUID;
  key_west_seaport_id UUID;
  st_pete_marina_id UUID;
  
  -- You need to get these from your actual database
  sample_author_id UUID := (SELECT id FROM profiles LIMIT 1);
BEGIN
  -- Get category IDs
  SELECT id INTO boat_shows_id FROM event_categories WHERE name = 'Boat Shows';
  SELECT id INTO fishing_tournaments_id FROM event_categories WHERE name = 'Fishing Tournaments';
  SELECT id INTO regattas_id FROM event_categories WHERE name = 'Regattas & Races';
  SELECT id INTO marina_events_id FROM event_categories WHERE name = 'Marina Events';
  SELECT id INTO educational_id FROM event_categories WHERE name = 'Educational';
  SELECT id INTO social_id FROM event_categories WHERE name = 'Social & Meetups';
  SELECT id INTO demo_days_id FROM event_categories WHERE name = 'Demo Days';
  
  -- Get venue IDs
  SELECT id INTO miami_convention_id FROM event_venues WHERE name = 'Miami Beach Convention Center';
  SELECT id INTO bahia_mar_id FROM event_venues WHERE name = 'Bahia Mar Yachting Center';
  SELECT id INTO tampa_convention_id FROM event_venues WHERE name = 'Tampa Convention Center';
  SELECT id INTO key_west_seaport_id FROM event_venues WHERE name = 'Key West Historic Seaport';
  SELECT id INTO st_pete_marina_id FROM event_venues WHERE name = 'St. Petersburg Marina';

  -- Insert July 2025 Events
  INSERT INTO events (
    author_id,
    organizer_business_id,
    category_id,
    title,
    description,
    short_description,
    event_start,
    event_end,
    all_day,
    venue_id,
    location_name,
    location_city,
    location_state,
    event_visibility,
    max_attendees,
    registration_required,
    cost,
    cost_description,
    contact_email,
    website_url,
    featured_image_url,
    tags,
    status,
    approval_status,
    organizer_verified,
    is_featured
  ) VALUES
  (
    sample_author_id,
    (SELECT id FROM businesses WHERE business_name ILIKE '%marina%' LIMIT 1),
    boat_shows_id,
    'Miami International Boat Show Summer Preview',
    'Get an exclusive preview of the latest boats and marine technology before the main show season. Features over 200 exhibitors showcasing everything from center consoles to luxury yachts.',
    'Preview the latest boats and marine tech with 200+ exhibitors',
    '2025-07-03 10:00:00-04',
    '2025-07-06 18:00:00-04',
    false,
    miami_convention_id,
    NULL,
    'Miami Beach',
    'FL',
    'public',
    5000,
    false,
    25.00,
    '$25 general admission, kids under 12 free',
    'info@miamiboatshow.com',
    'https://miamiboatshow.com',
    'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800',
    ARRAY['boat-show', 'miami', 'yachts', 'new-boats'],
    'published',
    'approved',
    true,
    true
  ),
  (
    sample_author_id,
    (SELECT id FROM businesses LIMIT 1),
    fishing_tournaments_id,
    'Keys Slam Fishing Tournament',
    'Three-day competitive fishing tournament targeting tarpon, bonefish, and permit. Captain''s meeting July 10th, fishing days July 11-13. Over $100,000 in prizes!',
    'Prestigious Keys fishing tournament with $100k in prizes',
    '2025-07-11 05:00:00-04',
    '2025-07-13 20:00:00-04',
    false,
    NULL,
    'Hawks Cay Resort Marina',
    'Duck Key',
    'FL',
    'public',
    200,
    true,
    500.00,
    '$500 per boat entry fee',
    'register@keysslam.com',
    'https://keysslam.com',
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
    ARRAY['fishing', 'tournament', 'keys', 'tarpon', 'competitive'],
    'published',
    'approved',
    true,
    false
  ),
  (
    sample_author_id,
    (SELECT id FROM businesses LIMIT 1),
    regattas_id,
    'Tampa Bay Lightning Regatta',
    'Annual summer sailing regatta featuring multiple classes including J/70, Melges 24, and PHRF. Racing in Tampa Bay with post-race parties at the yacht club.',
    'Premier summer sailing regatta in Tampa Bay',
    '2025-07-19 09:00:00-04',
    '2025-07-20 17:00:00-04',
    false,
    NULL,
    'Davis Island Yacht Club',
    'Tampa',
    'FL',
    'public',
    150,
    true,
    175.00,
    '$175 per boat, includes two dinner tickets',
    'race@diyc.org',
    'https://diyc.org/regatta',
    'https://images.unsplash.com/photo-1569163139394-de4798d9c2c3?w=800',
    ARRAY['sailing', 'regatta', 'racing', 'tampa-bay'],
    'published',
    'approved',
    true,
    false
  ),
  (
    sample_author_id,
    (SELECT id FROM businesses LIMIT 1),
    marina_events_id,
    'Sunset Jazz & BBQ at the Marina',
    'Enjoy live jazz music, BBQ, and beautiful sunset views at Bahia Mar. Family-friendly event with kids activities, food trucks, and local craft vendors.',
    'Live jazz, BBQ, and sunset views at Bahia Mar',
    '2025-07-12 17:00:00-04',
    '2025-07-12 21:00:00-04',
    false,
    bahia_mar_id,
    NULL,
    'Fort Lauderdale',
    'FL',
    'public',
    500,
    false,
    0.00,
    'Free admission, food and drinks available for purchase',
    'events@bahiamar.com',
    'https://bahiamar.com/events',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
    ARRAY['music', 'family', 'marina', 'free'],
    'published',
    'approved',
    true,
    false
  ),
  (
    sample_author_id,
    (SELECT id FROM businesses LIMIT 1),
    educational_id,
    'USCG Captain''s License Course',
    'Intensive 5-day OUPV/Six-Pack captain''s license course. Covers navigation, safety, regulations, and seamanship. All materials included. Must pass exam on final day.',
    '5-day USCG Captain''s License preparation course',
    '2025-07-14 08:00:00-04',
    '2025-07-18 17:00:00-04',
    false,
    NULL,
    'Maritime Professional Training',
    'St. Petersburg',
    'FL',
    'public',
    24,
    true,
    695.00,
    '$695 includes all materials and exam fees',
    'training@mptusa.com',
    'https://mptusa.com',
    'https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=800',
    ARRAY['education', 'captain-license', 'uscg', 'training'],
    'published',
    'approved',
    true,
    false
  ),
  (
    sample_author_id,
    (SELECT id FROM businesses LIMIT 1),
    social_id,
    'Full Moon Raft-Up Party',
    'Join fellow boaters for a full moon raft-up in Biscayne Bay. Bring your boat, drinks, and good vibes. VHF Channel 68 for coordination. All boats welcome!',
    'Monthly full moon raft-up party in Biscayne Bay',
    '2025-07-13 18:00:00-04',
    '2025-07-13 23:00:00-04',
    false,
    NULL,
    'Biscayne Bay - Nixon Sandbar',
    'Key Biscayne',
    'FL',
    'public',
    100,
    false,
    0.00,
    'Free - BYOB',
    'floridaboaters@gmail.com',
    NULL,
    'https://images.unsplash.com/photo-1522255272218-7ac5249be344?w=800',
    ARRAY['social', 'raft-up', 'party', 'boating'],
    'published',
    'approved',
    false,
    false
  ),
  (
    sample_author_id,
    (SELECT id FROM businesses LIMIT 1),
    demo_days_id,
    'Sea Ray Demo Days',
    'Test drive the latest Sea Ray models including the new SLX series and Sundancer lineup. Factory representatives on-site. Register for your preferred time slot.',
    'Test drive the latest Sea Ray models',
    '2025-07-26 09:00:00-04',
    '2025-07-27 17:00:00-04',
    false,
    NULL,
    'MarineMax Fort Lauderdale',
    'Fort Lauderdale',
    'FL',
    'public',
    200,
    true,
    0.00,
    'Free - Registration required',
    'demos@marinemax.com',
    'https://marinemax.com/demo-days',
    'https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=800',
    ARRAY['demo', 'sea-ray', 'test-drive', 'new-boats'],
    'published',
    'approved',
    true,
    false
  ),
  (
    sample_author_id,
    (SELECT id FROM businesses LIMIT 1),
    fishing_tournaments_id,
    'Kids Fishing Clinic & Tournament',
    'Free fishing clinic for kids ages 5-15. Learn basic fishing skills, marine conservation, and compete for prizes. Rods and bait provided. Parents welcome!',
    'Free kids fishing clinic and friendly competition',
    '2025-07-05 08:00:00-04',
    '2025-07-05 12:00:00-04',
    false,
    key_west_seaport_id,
    NULL,
    'Key West',
    'FL',
    'public',
    100,
    true,
    0.00,
    'Free event - donations accepted',
    'kids@keywestfishing.org',
    NULL,
    'https://images.unsplash.com/photo-1504309092620-4d0ec726efa4?w=800',
    ARRAY['kids', 'fishing', 'education', 'free', 'family'],
    'published',
    'approved',
    true,
    false
  ),
  (
    sample_author_id,
    (SELECT id FROM businesses LIMIT 1),
    marina_events_id,
    'Independence Day Boat Parade & Fireworks',
    'Annual 4th of July boat parade starting at 6 PM. Decorate your boat in patriotic themes and join the parade. Fireworks show at 9 PM visible from the water.',
    'July 4th boat parade and fireworks spectacular',
    '2025-07-04 18:00:00-04',
    '2025-07-04 22:00:00-04',
    false,
    NULL,
    'Sarasota Bay',
    'Sarasota',
    'FL',
    'public',
    500,
    true,
    0.00,
    'Free to participate or watch',
    'parade@sarasotaboating.com',
    NULL,
    'https://images.unsplash.com/photo-1473186505569-9c61870c11f9?w=800',
    ARRAY['july-4th', 'parade', 'fireworks', 'family', 'free'],
    'published',
    'approved',
    true,
    true
  ),
  (
    sample_author_id,
    (SELECT id FROM businesses LIMIT 1),
    educational_id,
    'Women''s Intro to Boating Workshop',
    'Hands-on workshop designed for women new to boating. Covers boat handling, docking, anchoring, safety, and basic maintenance. Small group instruction on actual boats.',
    'Empowering women through hands-on boating education',
    '2025-07-20 09:00:00-04',
    '2025-07-20 16:00:00-04',
    false,
    st_pete_marina_id,
    NULL,
    'St. Petersburg',
    'FL',
    'public',
    20,
    true,
    125.00,
    '$125 includes lunch and materials',
    'women@boatingworkshops.com',
    'https://womenboating.org',
    'https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=800',
    ARRAY['women', 'education', 'beginner', 'workshop'],
    'published',
    'approved',
    true,
    false
  );
  
  -- Add some attendees to make events look active
  -- Note: You'll need actual user IDs from your profiles table
  -- This is just an example of how to add attendee counts
  UPDATE events 
  SET attendee_count = 
    CASE 
      WHEN is_featured = true THEN floor(random() * max_attendees * 0.8)::integer
      ELSE floor(random() * max_attendees * 0.5)::integer
    END
  WHERE attendee_count = 0;
  
END $$;

-- Note: After running this script, you should:
-- 1. Update organizer_business_id fields with actual business IDs from your database
-- 2. Update author_id with actual user IDs
-- 3. Consider adding some event_business_associations to show vendors/sponsors