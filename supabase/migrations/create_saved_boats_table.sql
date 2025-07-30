-- Create saved_boats table for users to save their favorite boats
CREATE TABLE IF NOT EXISTS saved_boats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  boat_id UUID REFERENCES boats(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT, -- Optional notes about why they saved this boat
  UNIQUE(user_id, boat_id) -- Prevent duplicate saves
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_boats_user_id ON saved_boats(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_boats_boat_id ON saved_boats(boat_id);
CREATE INDEX IF NOT EXISTS idx_saved_boats_saved_at ON saved_boats(saved_at DESC);

-- Enable RLS
ALTER TABLE saved_boats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own saved boats
CREATE POLICY "Users can view their saved boats" ON saved_boats
FOR SELECT USING (auth.uid() = user_id);

-- Users can save boats
CREATE POLICY "Users can save boats" ON saved_boats
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM boats 
    WHERE boats.id = boat_id 
    AND boats.status = 'active'
  )
);

-- Users can update their saved boats (for notes)
CREATE POLICY "Users can update their saved boats" ON saved_boats
FOR UPDATE USING (auth.uid() = user_id);

-- Users can remove saved boats
CREATE POLICY "Users can delete their saved boats" ON saved_boats
FOR DELETE USING (auth.uid() = user_id);

-- Function to get saved boats count for a specific boat
CREATE OR REPLACE FUNCTION get_boat_saves_count(boat_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  saves_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO saves_count
  FROM saved_boats
  WHERE boat_id = boat_id_param;
  
  RETURN saves_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a user has saved a specific boat
CREATE OR REPLACE FUNCTION is_boat_saved_by_user(boat_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_saved BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM saved_boats
    WHERE boat_id = boat_id_param AND user_id = user_id_param
  ) INTO is_saved;
  
  RETURN is_saved;
END;
$$ LANGUAGE plpgsql;