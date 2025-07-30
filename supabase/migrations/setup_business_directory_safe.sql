-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Add missing columns to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS business_hours JSONB,
ADD COLUMN IF NOT EXISTS coordinates POINT,
ADD COLUMN IF NOT EXISTS specialties TEXT[],
ADD COLUMN IF NOT EXISTS services_offered TEXT[],
ADD COLUMN IF NOT EXISTS amenities JSONB,
ADD COLUMN IF NOT EXISTS verification_status TEXT CHECK (verification_status IN ('unverified', 'pending', 'verified', 'flagged')) DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS business_status TEXT CHECK (business_status IN ('active', 'closed', 'seasonal', 'permanently_closed')) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS established_year INTEGER,
ADD COLUMN IF NOT EXISTS employee_count_range TEXT,
ADD COLUMN IF NOT EXISTS license_number TEXT;

-- Step 2: Create marina_details table
CREATE TABLE IF NOT EXISTS marina_details (
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE PRIMARY KEY,
    slip_count INTEGER,
    max_vessel_length INTEGER,
    max_vessel_draft DECIMAL(5,2),
    fuel_types TEXT[],
    has_fuel_dock BOOLEAN DEFAULT false,
    has_pump_out BOOLEAN DEFAULT false,
    has_haul_out BOOLEAN DEFAULT false,
    has_boat_ramp BOOLEAN DEFAULT false,
    has_dry_storage BOOLEAN DEFAULT false,
    amenities JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create business_photos table
CREATE TABLE IF NOT EXISTS business_photos (
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

-- Step 4: Create business_reviews table
CREATE TABLE IF NOT EXISTS business_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    title TEXT,
    review_text TEXT,
    service_date DATE,
    service_type TEXT,
    would_recommend BOOLEAN,
    response_text TEXT,
    response_date TIMESTAMP WITH TIME ZONE,
    response_by UUID REFERENCES profiles(id),
    helpful_votes INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('published', 'flagged', 'removed')) DEFAULT 'published',
    verified_customer BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, reviewer_id)
);

-- Step 5: Create review_helpfulness table
CREATE TABLE IF NOT EXISTS review_helpfulness (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    review_id UUID REFERENCES business_reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_business_photos_business_id ON business_photos(business_id);
CREATE INDEX IF NOT EXISTS idx_business_reviews_business_id ON business_reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_business_reviews_reviewer_id ON business_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_review_helpfulness_review_id ON review_helpfulness(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpfulness_user_id ON review_helpfulness(user_id);

-- Step 7: Enable RLS (safe - won't error if already enabled)
ALTER TABLE marina_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpfulness ENABLE ROW LEVEL SECURITY;

-- Step 8: Drop existing policies before creating new ones

-- Marina details policies
DROP POLICY IF EXISTS "Anyone can view marina details" ON marina_details;
DROP POLICY IF EXISTS "Business owners can manage marina details" ON marina_details;

-- Business photos policies
DROP POLICY IF EXISTS "Anyone can view business photos" ON business_photos;
DROP POLICY IF EXISTS "Business owners can manage their photos" ON business_photos;

-- Business reviews policies
DROP POLICY IF EXISTS "Anyone can view published reviews" ON business_reviews;
DROP POLICY IF EXISTS "Users can create one review per business" ON business_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON business_reviews;

-- Review helpfulness policies
DROP POLICY IF EXISTS "Anyone can view review helpfulness" ON review_helpfulness;
DROP POLICY IF EXISTS "Users can manage their own helpfulness votes" ON review_helpfulness;

-- Step 9: Create RLS Policies

-- Marina details policies
CREATE POLICY "Anyone can view marina details" ON marina_details
    FOR SELECT USING (true);

CREATE POLICY "Business owners can manage marina details" ON marina_details
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM businesses 
            WHERE businesses.id = marina_details.business_id 
            AND businesses.claimed_by = auth.uid()
        )
    );

-- Business photos policies
CREATE POLICY "Anyone can view business photos" ON business_photos
    FOR SELECT USING (true);

CREATE POLICY "Business owners can manage their photos" ON business_photos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM businesses 
            WHERE businesses.id = business_photos.business_id 
            AND businesses.claimed_by = auth.uid()
        )
    );

-- Business reviews policies
CREATE POLICY "Anyone can view published reviews" ON business_reviews
    FOR SELECT USING (status = 'published');

CREATE POLICY "Users can create one review per business" ON business_reviews
    FOR INSERT WITH CHECK (
        auth.uid() = reviewer_id
        AND NOT EXISTS (
            SELECT 1 FROM business_reviews br
            WHERE br.business_id = business_reviews.business_id
            AND br.reviewer_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own reviews" ON business_reviews
    FOR UPDATE USING (reviewer_id = auth.uid());

-- Review helpfulness policies
CREATE POLICY "Anyone can view review helpfulness" ON review_helpfulness
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own helpfulness votes" ON review_helpfulness
    FOR ALL USING (user_id = auth.uid());

-- Step 10: Create or replace the increment function
CREATE OR REPLACE FUNCTION increment(table_name text, column_name text, row_id uuid)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE %I SET %I = %I + 1 WHERE id = $1', table_name, column_name, column_name) USING row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant usage on functions
GRANT EXECUTE ON FUNCTION increment TO authenticated;