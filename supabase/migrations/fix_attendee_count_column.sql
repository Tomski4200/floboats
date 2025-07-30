-- Check if attendee_count is a generated column
SELECT 
    column_name,
    data_type,
    is_generated,
    generation_expression
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'events'
AND column_name = 'attendee_count';

-- If it's a generated column that references event_attendees, drop it
ALTER TABLE events DROP COLUMN IF EXISTS attendee_count CASCADE;

-- Add it back as a regular column with default 0
ALTER TABLE events ADD COLUMN attendee_count INTEGER DEFAULT 0;

-- Update existing events to have 0 attendees for now
UPDATE events SET attendee_count = 0;