-- Add logo_url column to businesses table (not events table)
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add a comment to the column
COMMENT ON COLUMN businesses.logo_url IS 'URL to the business logo image';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'businesses' AND column_name = 'logo_url';