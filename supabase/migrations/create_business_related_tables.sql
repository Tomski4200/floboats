-- Create business_photos table if it doesn't exist
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

-- Create business_reviews table if it doesn't exist
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

-- Create review_helpfulness table if it doesn't exist
CREATE TABLE IF NOT EXISTS review_helpfulness (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    review_id UUID REFERENCES business_reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_photos_business_id ON business_photos(business_id);
CREATE INDEX IF NOT EXISTS idx_business_reviews_business_id ON business_reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_business_reviews_reviewer_id ON business_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_review_helpfulness_review_id ON review_helpfulness(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpfulness_user_id ON review_helpfulness(user_id);

-- Enable RLS
ALTER TABLE business_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpfulness ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_photos
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

-- RLS Policies for business_reviews
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

-- RLS Policies for review_helpfulness
CREATE POLICY "Anyone can view review helpfulness" ON review_helpfulness
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own helpfulness votes" ON review_helpfulness
    FOR ALL USING (user_id = auth.uid());