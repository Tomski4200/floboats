-- Add missing columns to businesses table
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