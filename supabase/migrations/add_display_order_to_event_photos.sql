-- Add display_order column to event_photos table (optional)
ALTER TABLE event_photos 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add a comment to the column
COMMENT ON COLUMN event_photos.display_order IS 'Order in which photos should be displayed';

-- Update existing photos to have sequential display_order
WITH numbered_photos AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY created_at) as rn
  FROM event_photos
)
UPDATE event_photos
SET display_order = numbered_photos.rn - 1
FROM numbered_photos
WHERE event_photos.id = numbered_photos.id;