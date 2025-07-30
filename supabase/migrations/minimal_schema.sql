-- Minimal FloBoats Schema - Phase 1 Core Tables Only
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
    boat_type TEXT,
    engine_type TEXT,
    engine_hours INTEGER,
    condition_rating INTEGER CHECK (condition_rating >= 1 AND condition_rating <= 10),
    hull_id TEXT,
    home_port TEXT,
    description TEXT,
    specs JSONB,
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

-- Basic Business Directory
CREATE TABLE businesses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES business_categories(id),
    claimed_by UUID REFERENCES profiles(id),
    business_name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    short_description TEXT,
    phone TEXT,
    email TEXT,
    website_url TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'FL',
    zip_code TEXT,
    county TEXT,
    license_number TEXT,
    established_year INTEGER,
    specialties TEXT[],
    verification_status TEXT CHECK (verification_status IN ('unverified', 'pending', 'verified', 'flagged')) DEFAULT 'unverified',
    claim_status TEXT CHECK (claim_status IN ('unclaimed', 'pending', 'claimed', 'disputed')) DEFAULT 'unclaimed',
    business_status TEXT CHECK (business_status IN ('active', 'closed', 'seasonal', 'permanently_closed')) DEFAULT 'active',
    listing_status TEXT CHECK (listing_status IN ('draft', 'published', 'suspended')) DEFAULT 'published',
    is_premium BOOLEAN DEFAULT false,
    average_rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_boats_owner_id ON boats(owner_id);
CREATE INDEX idx_boats_boat_type ON boats(boat_type);
CREATE INDEX idx_boats_for_sale ON boats(is_for_sale);
CREATE INDEX idx_listings_seller_id ON listings(seller_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_businesses_category_id ON businesses(category_id);
CREATE INDEX idx_businesses_city ON businesses(city);
CREATE INDEX idx_businesses_state ON businesses(state);
CREATE INDEX idx_businesses_claim_status ON businesses(claim_status);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE boats ENABLE ROW LEVEL SECURITY;
ALTER TABLE boat_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public boats are viewable by everyone" ON boats FOR SELECT USING (visibility = 'public' OR owner_id = auth.uid());
CREATE POLICY "Users can insert own boats" ON boats FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own boats" ON boats FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Active listings are viewable by everyone" ON listings FOR SELECT USING (status = 'active' OR seller_id = auth.uid());
CREATE POLICY "Users can insert own listings" ON listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Users can update own listings" ON listings FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Published businesses are viewable by everyone" ON businesses FOR SELECT USING (listing_status = 'published');
CREATE POLICY "Business owners can update their businesses" ON businesses FOR UPDATE USING (auth.uid() = claimed_by);

-- Insert business categories
INSERT INTO business_categories (name, description, icon) VALUES
('Marinas', 'Full-service marinas and harbors', 'anchor'),
('Boat Dealerships', 'New and used boat dealers', 'store'),
('Boat Repair & Service', 'Maintenance and repair services', 'wrench'),
('Marine Supply Stores', 'Parts, accessories, and equipment', 'package'),
('Boat Storage', 'Dry storage and boat yards', 'warehouse'),
('Boat Rentals & Charters', 'Rental and charter services', 'calendar'),
('Marine Insurance', 'Boat insurance providers', 'shield'),
('Boat Transport', 'Boat hauling and transport services', 'truck');