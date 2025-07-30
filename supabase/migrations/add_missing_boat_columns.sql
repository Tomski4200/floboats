-- Add missing columns to boats table

-- Add title column (required by form)
ALTER TABLE boats 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Add price column
ALTER TABLE boats 
ADD COLUMN IF NOT EXISTS price INTEGER;

-- Add location column (city, state combined)
ALTER TABLE boats 
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add engine-related columns
ALTER TABLE boats 
ADD COLUMN IF NOT EXISTS engine_make TEXT,
ADD COLUMN IF NOT EXISTS engine_model TEXT,
ADD COLUMN IF NOT EXISTS engine_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS horsepower_per_engine INTEGER;

-- Add fuel_type column
ALTER TABLE boats 
ADD COLUMN IF NOT EXISTS fuel_type TEXT;

-- Add hull_material column
ALTER TABLE boats 
ADD COLUMN IF NOT EXISTS hull_material TEXT;

-- Add has_title column (boolean for title in hand)
ALTER TABLE boats 
ADD COLUMN IF NOT EXISTS has_title BOOLEAN DEFAULT true;

-- Add has_trailer column
ALTER TABLE boats 
ADD COLUMN IF NOT EXISTS has_trailer BOOLEAN DEFAULT false;

-- Add status column
ALTER TABLE boats 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add is_featured column
ALTER TABLE boats 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Update check constraint for engine count to allow 0
ALTER TABLE boats 
DROP CONSTRAINT IF EXISTS check_engine_count;

ALTER TABLE boats
ADD CONSTRAINT check_engine_count CHECK (engine_count >= 0 AND engine_count <= 10);