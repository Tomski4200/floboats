-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    bio TEXT,
    location TEXT,
    phone TEXT,
    website TEXT,
    avatar_url TEXT,
    is_dealer BOOLEAN DEFAULT false,
    reputation_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Boats
CREATE TABLE boats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER,
    length_feet DECIMAL(5,2),
    boat_type TEXT, -- sailboat, motor_yacht, fishing, pontoon, etc.
    engine_type TEXT, -- outboard, inboard, sail, etc.
    engine_hours INTEGER,
    condition_rating INTEGER CHECK (condition_rating >= 1 AND condition_rating <= 10),
    hull_id TEXT, -- Hull Identification Number
    home_port TEXT,
    description TEXT,
    specs JSONB, -- flexible storage for additional specs
    is_for_sale BOOLEAN DEFAULT false,
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'friends')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Boat Photos
CREATE TABLE boat_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    boat_id UUID REFERENCES boats(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption TEXT,
    is_primary BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketplace Listings
CREATE TABLE listings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    boat_id UUID REFERENCES boats(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(12,2),
    currency TEXT DEFAULT 'USD',
    negotiable BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sold', 'expired')),
    listing_type TEXT DEFAULT 'sale' CHECK (listing_type IN ('sale', 'charter', 'slip_rental')),
    view_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forums/Categories
CREATE TABLE forums (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT, -- general, fishing, maintenance, destinations, etc.
    order_index INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Threads
CREATE TABLE threads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    forum_id UUID REFERENCES forums(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    reply_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    last_reply_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Thread Replies/Comments
CREATE TABLE replies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    reply_to_id UUID REFERENCES replies(id), -- for nested replies
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Likes (for replies/posts)
CREATE TABLE likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reply_id UUID REFERENCES replies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, reply_id)
);

-- Saved/Favorited Listings
CREATE TABLE saved_listings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, listing_id)
);

-- User Following System
CREATE TABLE follows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Listing Inquiries/Messages
CREATE TABLE inquiries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    inquirer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    contact_phone TEXT,
    contact_email TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'responded', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_boats_owner_id ON boats(owner_id);
CREATE INDEX idx_boats_boat_type ON boats(boat_type);
CREATE INDEX idx_boats_for_sale ON boats(is_for_sale);
CREATE INDEX idx_listings_seller_id ON listings(seller_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_threads_forum_id ON threads(forum_id);
CREATE INDEX idx_threads_author_id ON threads(author_id);
CREATE INDEX idx_replies_thread_id ON replies(thread_id);
CREATE INDEX idx_replies_author_id ON replies(author_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE boats ENABLE ROW LEVEL SECURITY;
ALTER TABLE boat_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Business Categories
CREATE TABLE business_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_category_id UUID REFERENCES business_categories(id),
    icon TEXT,
    color_hex TEXT DEFAULT '#3B82F6',
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Businesses
CREATE TABLE businesses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES business_categories(id),
    claimed_by UUID REFERENCES profiles(id), -- user who claimed the business
    business_name TEXT NOT NULL,
    slug TEXT UNIQUE, -- SEO-friendly URL slug
    description TEXT,
    short_description TEXT, -- for listings
    phone TEXT,
    email TEXT,
    website_url TEXT,
    business_hours JSONB, -- {monday: {open: "08:00", close: "17:00", closed: false}}
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'FL',
    zip_code TEXT,
    coordinates POINT, -- lat/lng for mapping
    county TEXT,
    license_number TEXT, -- dealer license, marina permit, etc.
    established_year INTEGER,
    employee_count_range TEXT, -- "1-10", "11-50", "51-200", etc.
    specialties TEXT[], -- array of specialties/services
    brands_carried TEXT[], -- boat brands for dealers
    services_offered TEXT[], -- services array
    amenities JSONB, -- marina amenities, dealer features
    social_media JSONB, -- {facebook: "url", instagram: "url", etc.}
    verification_status TEXT CHECK (verification_status IN ('unverified', 'pending', 'verified', 'flagged')) DEFAULT 'unverified',
    claim_status TEXT CHECK (claim_status IN ('unclaimed', 'pending', 'claimed', 'disputed')) DEFAULT 'unclaimed',
    claimed_at TIMESTAMP WITH TIME ZONE,
    business_status TEXT CHECK (business_status IN ('active', 'closed', 'seasonal', 'permanently_closed')) DEFAULT 'active',
    listing_status TEXT CHECK (listing_status IN ('draft', 'published', 'suspended')) DEFAULT 'published',
    is_premium BOOLEAN DEFAULT false,
    premium_expires_at TIMESTAMP WITH TIME ZONE,
    average_rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    claim_count INTEGER DEFAULT 0, -- track claim attempts
    seo_title TEXT,
    seo_description TEXT,
    seo_keywords TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business Photos
CREATE TABLE business_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption TEXT,
    photo_type TEXT CHECK (photo_type IN ('logo', 'exterior', 'interior', 'products', 'staff', 'other')) DEFAULT 'other',
    is_primary BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES profiles(id),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business Reviews
CREATE TABLE business_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    title TEXT,
    review_text TEXT,
    service_date DATE, -- when they used the service
    service_type TEXT, -- what service they used
    would_recommend BOOLEAN,
    response_text TEXT, -- business owner response
    response_date TIMESTAMP WITH TIME ZONE,
    response_by UUID REFERENCES profiles(id),
    helpful_votes INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('published', 'flagged', 'removed')) DEFAULT 'published',
    verified_customer BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, reviewer_id) -- one review per user per business
);

-- Business Review Helpfulness
CREATE TABLE review_helpfulness (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    review_id UUID REFERENCES business_reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

-- Business Claim Requests
CREATE TABLE business_claims (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    claimant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    claim_type TEXT CHECK (claim_type IN ('owner', 'manager', 'employee')) DEFAULT 'owner',
    verification_documents TEXT[], -- URLs to uploaded documents
    business_email TEXT, -- email from business domain
    business_phone TEXT,
    additional_info TEXT,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'needs_info')) DEFAULT 'pending',
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marina-Specific Information
CREATE TABLE marina_details (
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE PRIMARY KEY,
    slip_count INTEGER,
    max_boat_length INTEGER, -- in feet
    max_beam INTEGER, -- in feet
    max_draft INTEGER, -- in feet
    water_depth_min INTEGER, -- in feet
    water_depth_max INTEGER, -- in feet
    dockage_rates JSONB, -- daily, weekly, monthly, annual rates
    fuel_types TEXT[], -- gas, diesel, etc.
    pump_out_service BOOLEAN DEFAULT false,
    electrical_service TEXT[], -- 30amp, 50amp, 110v, 220v
    water_hookup BOOLEAN DEFAULT false,
    wifi_available BOOLEAN DEFAULT false,
    security_features TEXT[],
    boat_services TEXT[], -- maintenance, repairs, storage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dealership-Specific Information  
CREATE TABLE dealership_details (
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE PRIMARY KEY,
    dealer_type TEXT CHECK (dealer_type IN ('new', 'used', 'both')) DEFAULT 'both',
    authorized_brands TEXT[], -- manufacturers they're authorized for
    inventory_count INTEGER DEFAULT 0,
    lot_size_acres DECIMAL(5,2),
    financing_available BOOLEAN DEFAULT false,
    trade_ins_accepted BOOLEAN DEFAULT false,
    warranty_service BOOLEAN DEFAULT false,
    parts_department BOOLEAN DEFAULT false,
    service_department BOOLEAN DEFAULT false,
    boat_storage BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business Hours (for more complex scheduling)
CREATE TABLE business_operating_hours (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT false,
    is_24_hours BOOLEAN DEFAULT false,
    seasonal_start DATE, -- for seasonal businesses
    seasonal_end DATE,
    notes TEXT, -- "Call ahead", "By appointment only"
);

-- Business Staff/Team Members
CREATE TABLE business_staff (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id), -- if they have an account
    name TEXT NOT NULL,
    title TEXT,
    email TEXT,
    phone TEXT,
    bio TEXT,
    photo_url TEXT,
    role TEXT CHECK (role IN ('owner', 'manager', 'sales', 'service', 'admin')) DEFAULT 'admin',
    can_manage_listing BOOLEAN DEFAULT false,
    can_respond_reviews BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for businesses
CREATE INDEX idx_businesses_category_id ON businesses(category_id);
CREATE INDEX idx_businesses_city ON businesses(city);
CREATE INDEX idx_businesses_state ON businesses(state);
CREATE INDEX idx_businesses_claim_status ON businesses(claim_status);
CREATE INDEX idx_businesses_verification_status ON businesses(verification_status);
CREATE INDEX idx_businesses_business_status ON businesses(business_status);
CREATE INDEX idx_businesses_claimed_by ON businesses(claimed_by);
CREATE INDEX idx_businesses_specialties ON businesses USING GIN(specialties);
CREATE INDEX idx_businesses_brands ON businesses USING GIN(brands_carried);
CREATE INDEX idx_businesses_rating ON businesses(average_rating);
CREATE INDEX idx_businesses_slug ON businesses(slug);
CREATE INDEX idx_business_reviews_business_id ON business_reviews(business_id);
CREATE INDEX idx_business_reviews_rating ON business_reviews(rating);
CREATE INDEX idx_business_claims_business_id ON business_claims(business_id);
CREATE INDEX idx_business_claims_status ON business_claims(status);

-- Insert business categories
INSERT INTO business_categories (name, description, icon) VALUES
('Marinas', 'Full-service marinas and harbors', 'anchor'),
('Boat Dealerships', 'New and used boat dealers', 'store'),
('Boat Repair & Service', 'Maintenance and repair services', 'wrench'),
('Marine Supply Stores', 'Parts, accessories, and equipment', 'package'),
('Boat Storage', 'Dry storage and boat yards', 'warehouse'),
('Boat Rentals & Charters', 'Rental and charter services', 'calendar'),
('Marine Insurance', 'Boat insurance providers', 'shield'),
('Boat Transport', 'Boat hauling and transport services', 'truck'),
('Marine Electronics', 'GPS, fish finders, communication equipment', 'radio'),
('Boat Cleaning & Detailing', 'Professional cleaning services', 'sparkles'),
('Fuel Docks', 'Marine fuel stations', 'fuel'),
('Marine Surveyors', 'Boat inspection and survey services', 'clipboard');

-- Enable RLS for business tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE marina_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealership_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_staff ENABLE ROW LEVEL SECURITY;

-- Business RLS Policies
CREATE POLICY "Published businesses are viewable by everyone" ON businesses FOR SELECT USING (listing_status = 'published');
CREATE POLICY "Business owners can update their businesses" ON businesses FOR UPDATE USING (auth.uid() = claimed_by);
CREATE POLICY "Admins can create businesses" ON businesses FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Business reviews are viewable by everyone" ON business_reviews FOR SELECT USING (status = 'published');
CREATE POLICY "Users can create reviews" ON business_reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = reviewer_id);
CREATE POLICY "Users can update their own reviews" ON business_reviews FOR UPDATE USING (auth.uid() = reviewer_id);
CREATE POLICY "Business owners can respond to reviews" ON business_reviews FOR UPDATE USING (
    EXISTS (SELECT 1 FROM businesses WHERE businesses.id = business_reviews.business_id AND businesses.claimed_by = auth.uid())
);

CREATE POLICY "Users can submit business claims" ON business_claims FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = claimant_id);
CREATE POLICY "Users can view their own claims" ON business_claims FOR SELECT USING (auth.uid() = claimant_id);

-- Event Categories
CREATE TABLE event_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color_hex TEXT DEFAULT '#3B82F6', -- for calendar display
    icon TEXT, -- icon name for UI
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events
CREATE TABLE events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organizer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES event_categories(id),
    title TEXT NOT NULL,
    description TEXT,
    short_description TEXT, -- for calendar previews
    event_start TIMESTAMP WITH TIME ZONE NOT NULL,
    event_end TIMESTAMP WITH TIME ZONE,
    timezone TEXT DEFAULT 'America/New_York',
    all_day BOOLEAN DEFAULT false,
    recurring_type TEXT CHECK (recurring_type IN ('none', 'daily', 'weekly', 'monthly', 'yearly')) DEFAULT 'none',
    recurring_end_date TIMESTAMP WITH TIME ZONE,
    location_name TEXT,
    location_address TEXT,
    location_city TEXT,
    location_state TEXT,
    location_coordinates POINT, -- PostGIS point for lat/lng
    venue_details TEXT, -- marina info, dock numbers, etc.
    event_type TEXT CHECK (event_type IN ('public', 'private', 'members_only')) DEFAULT 'public',
    max_attendees INTEGER,
    registration_required BOOLEAN DEFAULT false,
    registration_deadline TIMESTAMP WITH TIME ZONE,
    cost DECIMAL(10,2) DEFAULT 0,
    cost_description TEXT, -- "Free", "$50 per boat", "BYOB", etc.
    contact_email TEXT,
    contact_phone TEXT,
    website_url TEXT,
    featured_image_url TEXT,
    status TEXT CHECK (status IN ('draft', 'published', 'cancelled', 'completed')) DEFAULT 'draft',
    approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'approved',
    tags TEXT[], -- searchable tags
    attendee_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event Photos/Media
CREATE TABLE event_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption TEXT,
    is_featured BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES profiles(id),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event Attendees/RSVPs
CREATE TABLE event_attendees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    attendance_status TEXT CHECK (attendance_status IN ('going', 'maybe', 'not_going', 'registered')) DEFAULT 'going',
    registration_data JSONB, -- custom form data
    boat_id UUID REFERENCES boats(id), -- which boat they're bringing
    guest_count INTEGER DEFAULT 0,
    special_requests TEXT,
    checked_in BOOLEAN DEFAULT false,
    check_in_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Event Comments/Updates
CREATE TABLE event_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    comment_type TEXT CHECK (comment_type IN ('comment', 'update', 'announcement')) DEFAULT 'comment',
    reply_to_id UUID REFERENCES event_comments(id),
    like_count INTEGER DEFAULT 0,
    is_organizer_post BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event Likes
CREATE TABLE event_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- Event Comment Likes
CREATE TABLE event_comment_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES event_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, comment_id)
);

-- User Event Subscriptions (for notifications)
CREATE TABLE event_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    notification_type TEXT CHECK (notification_type IN ('all', 'updates_only', 'none')) DEFAULT 'all',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- Create indexes for events
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_category_id ON events(category_id);
CREATE INDEX idx_events_start_date ON events(event_start);
CREATE INDEX idx_events_location_city ON events(location_city);
CREATE INDEX idx_events_location_state ON events(location_state);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_featured ON events(is_featured);
CREATE INDEX idx_events_tags ON events USING GIN(tags);
CREATE INDEX idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_user_id ON event_attendees(user_id);
CREATE INDEX idx_event_comments_event_id ON event_comments(event_id);

-- Insert default event categories
INSERT INTO event_categories (name, description, color_hex, icon) VALUES
('Boat Shows', 'Marine exhibitions and boat shows', '#3B82F6', 'boat'),
('Fishing Tournaments', 'Competitive fishing events', '#10B981', 'fish'),
('Regattas & Racing', 'Sailing competitions and races', '#F59E0B', 'trophy'),
('Social Events', 'Meetups, parties, and social gatherings', '#EF4444', 'users'),
('Educational', 'Boating safety, maintenance workshops', '#8B5CF6', 'book'),
('Cruises & Rallies', 'Group cruising and destination events', '#06B6D4', 'map'),
('Maintenance & Service', 'Boat maintenance and service events', '#6B7280', 'tool'),
('Seasonal Events', 'Launch parties, winterization, etc.', '#F97316', 'calendar');

-- Enable RLS for event tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_subscriptions ENABLE ROW LEVEL SECURITY;

-- Event RLS Policies
CREATE POLICY "Public events are viewable by everyone" ON events FOR SELECT USING (status = 'published' AND event_type = 'public' OR organizer_id = auth.uid());
CREATE POLICY "Users can create events" ON events FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = organizer_id);
CREATE POLICY "Organizers can update their events" ON events FOR UPDATE USING (auth.uid() = organizer_id);
CREATE POLICY "Organizers can delete their events" ON events FOR DELETE USING (auth.uid() = organizer_id);

CREATE POLICY "Event attendees viewable by event attendees and organizers" ON event_attendees FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM events WHERE events.id = event_attendees.event_id AND events.organizer_id = auth.uid())
);
CREATE POLICY "Users can RSVP to events" ON event_attendees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own RSVP" ON event_attendees FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Event comments are viewable by everyone" ON event_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment on events" ON event_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own comments" ON event_comments FOR UPDATE USING (auth.uid() = author_id);

-- Basic RLS Policies (you'll want to refine these)
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public boats are viewable by everyone" ON boats FOR SELECT USING (visibility = 'public' OR owner_id = auth.uid());
CREATE POLICY "Users can insert own boats" ON boats FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own boats" ON boats FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Active listings are viewable by everyone" ON listings FOR SELECT USING (status = 'active' OR seller_id = auth.uid());
CREATE POLICY "Users can insert own listings" ON listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Users can update own listings" ON listings FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Forum threads are viewable by everyone" ON threads FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create threads" ON threads FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own threads" ON threads FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Replies are viewable by everyone" ON replies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create replies" ON replies FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own replies" ON replies FOR UPDATE USING (auth.uid() = author_id);