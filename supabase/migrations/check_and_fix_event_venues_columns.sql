-- First, check what columns exist in event_venues table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'event_venues'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
ALTER TABLE event_venues 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS capacity INTEGER;

-- If the columns were added, let's update the comment on them
COMMENT ON COLUMN event_venues.address IS 'Street address of the venue';
COMMENT ON COLUMN event_venues.description IS 'Detailed description of the venue';
COMMENT ON COLUMN event_venues.capacity IS 'Maximum capacity of the venue';

-- Verify all columns now exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'event_venues'
ORDER BY ordinal_position;