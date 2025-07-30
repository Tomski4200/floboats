-- Create event_likes table for storing user likes/favorites
CREATE TABLE IF NOT EXISTS event_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_likes_event_id ON event_likes(event_id);
CREATE INDEX IF NOT EXISTS idx_event_likes_user_id ON event_likes(user_id);

-- Enable RLS
ALTER TABLE event_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view all likes" ON event_likes;
CREATE POLICY "Users can view all likes"
ON event_likes FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can like events" ON event_likes;
CREATE POLICY "Users can like events"
ON event_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike events" ON event_likes;
CREATE POLICY "Users can unlike events"
ON event_likes FOR DELETE
USING (auth.uid() = user_id);

-- Add a like_count column to events table for easy access
ALTER TABLE events
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

-- Create a function to update like count
CREATE OR REPLACE FUNCTION update_event_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events SET like_count = like_count + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events SET like_count = like_count - 1 WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain like count
DROP TRIGGER IF EXISTS update_event_like_count_trigger ON event_likes;
CREATE TRIGGER update_event_like_count_trigger
AFTER INSERT OR DELETE ON event_likes
FOR EACH ROW
EXECUTE FUNCTION update_event_like_count();