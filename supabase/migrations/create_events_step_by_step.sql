-- Step-by-step Events Setup
-- Run each section one at a time if you encounter errors

-- STEP 1: Create Event Categories Table FIRST
CREATE TABLE IF NOT EXISTS event_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color_hex TEXT DEFAULT '#3B82F6',
    icon TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 2: Insert Event Categories
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
    ('Other', 'Other marine-related events', '#6B7280', 'calendar', 10)
ON CONFLICT (name) DO NOTHING;

-- STEP 3: Create Event Venues Table
CREATE TABLE IF NOT EXISTS event_venues (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    coordinates POINT,
    capacity INTEGER,
    parking_info TEXT,
    amenities JSONB,
    venue_type TEXT,
    venue_contact_name TEXT,
    venue_contact_phone TEXT,
    venue_contact_email TEXT,
    photos TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 4: Insert Sample Venues
INSERT INTO event_venues (name, address_line1, city, state, zip_code, venue_type, capacity) VALUES
    ('Miami Beach Convention Center', '1901 Convention Center Dr', 'Miami Beach', 'FL', '33139', 'convention_center', 5000),
    ('Bahia Mar Yachting Center', '801 Seabreeze Blvd', 'Fort Lauderdale', 'FL', '33316', 'marina', 1000),
    ('Tampa Convention Center', '333 S Franklin St', 'Tampa', 'FL', '33602', 'convention_center', 3000),
    ('Key West Historic Seaport', '631 Greene St', 'Key West', 'FL', '33040', 'marina', 500),
    ('St. Petersburg Marina', '300 2nd Ave SE', 'St. Petersburg', 'FL', '33701', 'marina', 800)
ON CONFLICT DO NOTHING;

-- STEP 5: Now check if events table exists and what columns it has
DO $$
BEGIN
    -- Check if events table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
        -- Add missing columns to existing events table
        ALTER TABLE events ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES event_categories(id);
        ALTER TABLE events ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
        ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_business_id UUID REFERENCES businesses(id);
        ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES event_venues(id);
        ALTER TABLE events ADD COLUMN IF NOT EXISTS event_visibility TEXT CHECK (event_visibility IN ('public', 'private')) DEFAULT 'public';
        ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_url TEXT;
        ALTER TABLE events ADD COLUMN IF NOT EXISTS approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending';
        ALTER TABLE events ADD COLUMN IF NOT EXISTS approval_notes TEXT;
        ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_verified BOOLEAN DEFAULT false;
        ALTER TABLE events ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
        ALTER TABLE events ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;
        ALTER TABLE events ADD COLUMN IF NOT EXISTS attendee_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Updated existing events table with new columns';
    ELSE
        -- Create new events table
        CREATE TABLE events (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
            organizer_business_id UUID REFERENCES businesses(id),
            category_id UUID REFERENCES event_categories(id),
            title TEXT NOT NULL,
            description TEXT,
            short_description TEXT,
            event_start TIMESTAMP WITH TIME ZONE NOT NULL,
            event_end TIMESTAMP WITH TIME ZONE,
            timezone TEXT DEFAULT 'America/New_York',
            all_day BOOLEAN DEFAULT false,
            venue_id UUID REFERENCES event_venues(id),
            location_name TEXT,
            location_address TEXT,
            location_city TEXT,
            location_state TEXT,
            location_coordinates POINT,
            event_visibility TEXT CHECK (event_visibility IN ('public', 'private')) DEFAULT 'public',
            max_attendees INTEGER,
            registration_required BOOLEAN DEFAULT false,
            registration_deadline TIMESTAMP WITH TIME ZONE,
            registration_url TEXT,
            cost DECIMAL(10,2) DEFAULT 0,
            cost_description TEXT,
            contact_name TEXT,
            contact_email TEXT,
            contact_phone TEXT,
            website_url TEXT,
            featured_image_url TEXT,
            tags TEXT[],
            status TEXT CHECK (status IN ('draft', 'published', 'cancelled', 'revision_required')) DEFAULT 'draft',
            approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
            approval_notes TEXT,
            organizer_verified BOOLEAN DEFAULT false,
            view_count INTEGER DEFAULT 0,
            click_count INTEGER DEFAULT 0,
            attendee_count INTEGER DEFAULT 0,
            is_featured BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created new events table';
    END IF;
END $$;

-- STEP 6: Create other event-related tables
CREATE TABLE IF NOT EXISTS event_business_associations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    association_type TEXT DEFAULT 'participant',
    is_verified BOOLEAN DEFAULT false,
    added_by UUID REFERENCES profiles(id),
    booth_number TEXT,
    special_offers TEXT,
    description TEXT,
    featured_products TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, business_id)
);

CREATE TABLE IF NOT EXISTS event_attendees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    attendance_status TEXT CHECK (attendance_status IN ('invited', 'going', 'maybe', 'not_going')) DEFAULT 'invited',
    guest_count INTEGER DEFAULT 0,
    boat_id UUID REFERENCES boats(id),
    special_requests TEXT,
    checked_in BOOLEAN DEFAULT false,
    check_in_time TIMESTAMP WITH TIME ZONE,
    invited_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS event_updates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id),
    title TEXT,
    content TEXT NOT NULL,
    is_important BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption TEXT,
    uploaded_by UUID REFERENCES profiles(id),
    is_featured BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 7: Enable RLS
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_business_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;

-- STEP 8: Create basic RLS policies
-- Allow everyone to view event categories
DROP POLICY IF EXISTS "Event categories viewable by all" ON event_categories;
CREATE POLICY "Event categories viewable by all"
    ON event_categories FOR SELECT
    USING (is_active = true);

-- Allow everyone to view event venues
DROP POLICY IF EXISTS "Event venues viewable by all" ON event_venues;
CREATE POLICY "Event venues viewable by all"
    ON event_venues FOR SELECT
    USING (is_active = true);

-- Allow everyone to view public approved events
DROP POLICY IF EXISTS "Public events are viewable by everyone" ON events;
CREATE POLICY "Public events are viewable by everyone" 
    ON events FOR SELECT 
    USING (event_visibility = 'public' AND status = 'published' AND approval_status = 'approved');

-- STEP 9: Now we can safely insert sample events
INSERT INTO events (
  category_id,
  title,
  description,
  short_description,
  event_start,
  event_end,
  all_day,
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
  is_featured,
  attendee_count
) VALUES
(
  (SELECT id FROM event_categories WHERE name = 'Boat Shows'),
  'Miami International Boat Show Summer Preview',
  'Get an exclusive preview of the latest boats and marine technology before the main show season. Features over 200 exhibitors showcasing everything from center consoles to luxury yachts.',
  'Preview the latest boats and marine tech with 200+ exhibitors',
  '2025-07-03 10:00:00-04',
  '2025-07-06 18:00:00-04',
  false,
  'Miami Beach Convention Center',
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
  1247
);

-- Add more events...
-- (You can copy the rest of the INSERT statements from the previous files)

-- STEP 10: Verify everything worked
SELECT 
    (SELECT COUNT(*) FROM event_categories) as categories_count,
    (SELECT COUNT(*) FROM event_venues) as venues_count,
    (SELECT COUNT(*) FROM events) as events_count;