-- Add missing columns to boat_photos table

-- Add display_order column for ordering photos
ALTER TABLE boat_photos 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add is_primary column to mark the main photo
ALTER TABLE boat_photos 
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- Add storage_path column to track the file path in storage
ALTER TABLE boat_photos 
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Add uploaded_at timestamp
ALTER TABLE boat_photos 
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create an index on boat_id for faster queries
CREATE INDEX IF NOT EXISTS idx_boat_photos_boat_id ON boat_photos(boat_id);

-- Create an index on display_order for sorting
CREATE INDEX IF NOT EXISTS idx_boat_photos_display_order ON boat_photos(boat_id, display_order);