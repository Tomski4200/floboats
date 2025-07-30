-- Events Database Schema for FloBoats
-- Updated based on requirements discussion

-- Event Venues (reusable venue information)
CREATE TABLE event_venues (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    coordinates POINT, -- PostGIS point for lat/lng
    capacity INTEGER,
    parking_info TEXT,
    amenities JSONB, -- {restrooms: true, food_vendors: true, etc}
    venue_type TEXT, -- marina, convention_center, beach, park, etc
    venue_contact_name TEXT,
    venue_contact_phone TEXT,
    venue_contact_email TEXT,
    photos TEXT[], -- array of photo URLs
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events (main events table)
CREATE TABLE events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    -- Attribution
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- who posted it
    organizer_business_id UUID REFERENCES businesses(id), -- required: official organizer
    
    -- Basic Info
    title TEXT NOT NULL,
    description TEXT,
    short_description TEXT,
    
    -- Timing
    event_start TIMESTAMP WITH TIME ZONE NOT NULL,
    event_end TIMESTAMP WITH TIME ZONE,
    timezone TEXT DEFAULT 'America/New_York',
    all_day BOOLEAN DEFAULT false,
    
    -- Location (can use venue OR custom location)
    venue_id UUID REFERENCES event_venues(id),
    location_name TEXT, -- if not using venue
    location_address TEXT,
    location_city TEXT,
    location_state TEXT,
    location_coordinates POINT,
    
    -- Event Details
    event_visibility TEXT CHECK (event_visibility IN ('public', 'private')) DEFAULT 'public',
    max_attendees INTEGER,
    registration_required BOOLEAN DEFAULT false,
    registration_deadline TIMESTAMP WITH TIME ZONE,
    registration_url TEXT, -- external registration link
    cost DECIMAL(10,2) DEFAULT 0,
    cost_description TEXT,
    
    -- Contact Info
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    website_url TEXT,
    
    -- Media
    featured_image_url TEXT,
    tags TEXT[],
    
    -- Status & Moderation
    status TEXT CHECK (status IN ('draft', 'published', 'cancelled', 'revision_required')) DEFAULT 'draft',
    approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    approval_notes TEXT, -- admin notes on approval/rejection
    organizer_verified BOOLEAN DEFAULT false, -- has organizer verified this event?
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0, -- clicks to website/registration
    
    -- Metadata
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event Business Associations (many-to-many)
CREATE TABLE event_business_associations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    association_type TEXT DEFAULT 'participant', -- vendor, sponsor, exhibitor, participant, partner
    is_verified BOOLEAN DEFAULT false, -- has business confirmed their participation?
    added_by UUID REFERENCES profiles(id), -- who tagged this business
    
    -- Optional details (businesses can add these later)
    booth_number TEXT,
    special_offers TEXT,
    description TEXT,
    featured_products TEXT[],
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(event_id, business_id)
);

-- Event Attendees/RSVPs
CREATE TABLE event_attendees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- RSVP Status
    attendance_status TEXT CHECK (attendance_status IN ('invited', 'going', 'maybe', 'not_going')) DEFAULT 'invited',
    guest_count INTEGER DEFAULT 0,
    
    -- Additional Info
    boat_id UUID REFERENCES boats(id), -- which boat they're bringing
    special_requests TEXT,
    
    -- Check-in
    checked_in BOOLEAN DEFAULT false,
    check_in_time TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    invited_by UUID REFERENCES profiles(id), -- for private events
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(event_id, user_id)
);

-- Event Updates/Announcements
CREATE TABLE event_updates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id),
    title TEXT,
    content TEXT NOT NULL,
    is_important BOOLEAN DEFAULT false, -- for highlighting critical updates
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event Photos Gallery
CREATE TABLE event_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption TEXT,
    uploaded_by UUID REFERENCES profiles(id),
    is_featured BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_events_event_start ON events(event_start);
CREATE INDEX idx_events_organizer ON events(organizer_business_id);
CREATE INDEX idx_events_venue ON events(venue_id);
CREATE INDEX idx_events_status ON events(status, approval_status);
CREATE INDEX idx_events_visibility ON events(event_visibility);
CREATE INDEX idx_event_associations_business ON event_business_associations(business_id);
CREATE INDEX idx_event_associations_event ON event_business_associations(event_id);
CREATE INDEX idx_event_attendees_user ON event_attendees(user_id);
CREATE INDEX idx_event_attendees_event ON event_attendees(event_id);

-- Enable RLS
ALTER TABLE event_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_business_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (to be refined based on requirements)

-- Events policies
CREATE POLICY "Public events are viewable by everyone" 
    ON events FOR SELECT 
    USING (event_visibility = 'public' AND status = 'published' AND approval_status = 'approved');

CREATE POLICY "Private events viewable by attendees" 
    ON events FOR SELECT 
    USING (
        event_visibility = 'private' 
        AND EXISTS (
            SELECT 1 FROM event_attendees 
            WHERE event_attendees.event_id = events.id 
            AND event_attendees.user_id = auth.uid()
        )
    );

CREATE POLICY "Authors can manage their own events" 
    ON events FOR ALL 
    USING (author_id = auth.uid());

CREATE POLICY "Business managers can manage their events" 
    ON events FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM user_business_permissions 
            WHERE user_business_permissions.business_id = events.organizer_business_id 
            AND user_business_permissions.user_id = auth.uid()
            AND user_business_permissions.role IN ('owner', 'manager')
        )
    );

-- Event attendees policies
CREATE POLICY "Users can view attendees of public events they're attending" 
    ON event_attendees FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_attendees.event_id 
            AND (
                events.event_visibility = 'public' 
                OR EXISTS (
                    SELECT 1 FROM event_attendees ea2 
                    WHERE ea2.event_id = events.id 
                    AND ea2.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can manage their own attendance" 
    ON event_attendees FOR ALL 
    USING (user_id = auth.uid());

-- Event business associations policies
CREATE POLICY "Anyone can view public event associations" 
    ON event_business_associations FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_business_associations.event_id 
            AND events.event_visibility = 'public'
            AND events.status = 'published'
        )
    );

CREATE POLICY "Business managers can manage their associations" 
    ON event_business_associations FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM user_business_permissions 
            WHERE user_business_permissions.business_id = event_business_associations.business_id 
            AND user_business_permissions.user_id = auth.uid()
            AND user_business_permissions.role IN ('owner', 'manager')
        )
    );