-- Add new columns to boats table for enhanced boat listing requirements

-- Change length_feet to length_inches to store precise measurements
ALTER TABLE boats 
  DROP COLUMN IF EXISTS length_feet,
  ADD COLUMN IF NOT EXISTS length_inches INTEGER,
  ADD COLUMN IF NOT EXISTS beam_inches INTEGER;

-- Add engine count and horsepower
ALTER TABLE boats
  ADD COLUMN IF NOT EXISTS engine_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS horsepower_per_engine INTEGER;

-- Add hull ID (required) and title status
ALTER TABLE boats
  ADD COLUMN IF NOT EXISTS hull_id TEXT,
  ADD COLUMN IF NOT EXISTS has_title BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_trailer BOOLEAN DEFAULT false;

-- Make hull_id required for new boats (after adding the column)
-- Note: You may want to update existing boats with hull_id before making it NOT NULL
-- ALTER TABLE boats ALTER COLUMN hull_id SET NOT NULL;

-- Add check constraint for engine count (allowing 0 for boats without engines)
ALTER TABLE boats
  ADD CONSTRAINT check_engine_count CHECK (engine_count >= 0 AND engine_count <= 10);

-- Add check constraint for measurements
ALTER TABLE boats
  ADD CONSTRAINT check_length_inches CHECK (length_inches IS NULL OR length_inches > 0),
  ADD CONSTRAINT check_beam_inches CHECK (beam_inches IS NULL OR beam_inches > 0);

-- Create index on hull_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_boats_hull_id ON boats(hull_id);

-- Update any existing boats to have default values
UPDATE boats 
SET engine_count = 1 
WHERE engine_count IS NULL;

UPDATE boats 
SET has_title = true 
WHERE has_title IS NULL;