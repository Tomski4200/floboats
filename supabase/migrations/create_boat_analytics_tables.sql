-- Create boat_views table to track individual views
CREATE TABLE IF NOT EXISTS boat_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  boat_id UUID REFERENCES boats(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for anonymous viewers
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  session_id TEXT, -- To group views in the same session
  view_duration INTEGER, -- Duration in seconds
  is_owner_view BOOLEAN DEFAULT false -- Track if owner viewed their own listing
);

-- Create boat_analytics table for aggregated daily stats
CREATE TABLE IF NOT EXISTS boat_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  boat_id UUID REFERENCES boats(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  view_count INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  phone_clicks INTEGER DEFAULT 0,
  average_view_duration INTEGER, -- Average duration in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(boat_id, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_boat_views_boat_id ON boat_views(boat_id);
CREATE INDEX IF NOT EXISTS idx_boat_views_viewed_at ON boat_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_boat_views_viewer_id ON boat_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_boat_analytics_boat_id ON boat_analytics(boat_id);
CREATE INDEX IF NOT EXISTS idx_boat_analytics_date ON boat_analytics(date DESC);

-- Enable RLS
ALTER TABLE boat_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE boat_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for boat_views
-- Anyone can create view records (for tracking)
CREATE POLICY "Anyone can create boat views" ON boat_views
FOR INSERT WITH CHECK (true);

-- Boat owners can view their own boat's view records
CREATE POLICY "Boat owners can view their boat views" ON boat_views
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM boats 
    WHERE boats.id = boat_views.boat_id 
    AND boats.owner_id = auth.uid()
  )
);

-- RLS Policies for boat_analytics
-- Boat owners can view their own boat's analytics
CREATE POLICY "Boat owners can view their boat analytics" ON boat_analytics
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM boats 
    WHERE boats.id = boat_analytics.boat_id 
    AND boats.owner_id = auth.uid()
  )
);

-- Function to track a boat view
CREATE OR REPLACE FUNCTION track_boat_view(
  p_boat_id UUID,
  p_viewer_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_is_owner BOOLEAN;
  v_view_id UUID;
BEGIN
  -- Check if viewer is the owner
  IF p_viewer_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM boats 
      WHERE id = p_boat_id AND owner_id = p_viewer_id
    ) INTO v_is_owner;
  ELSE
    v_is_owner := false;
  END IF;

  -- Insert view record
  INSERT INTO boat_views (
    boat_id,
    viewer_id,
    ip_address,
    user_agent,
    referrer,
    session_id,
    is_owner_view
  ) VALUES (
    p_boat_id,
    p_viewer_id,
    p_ip_address,
    p_user_agent,
    p_referrer,
    p_session_id,
    v_is_owner
  ) RETURNING id INTO v_view_id;

  -- Update or insert daily analytics
  INSERT INTO boat_analytics (boat_id, date, view_count, unique_viewers)
  VALUES (p_boat_id, CURRENT_DATE, 1, 1)
  ON CONFLICT (boat_id, date) 
  DO UPDATE SET 
    view_count = boat_analytics.view_count + 1,
    unique_viewers = boat_analytics.unique_viewers + 
      CASE 
        WHEN NOT EXISTS (
          SELECT 1 FROM boat_views 
          WHERE boat_id = p_boat_id 
          AND DATE(viewed_at) = CURRENT_DATE
          AND (
            (viewer_id IS NOT NULL AND viewer_id = p_viewer_id) OR
            (viewer_id IS NULL AND ip_address = p_ip_address)
          )
          AND id != v_view_id
        ) THEN 1 
        ELSE 0 
      END,
    updated_at = NOW();

  RETURN v_view_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update view duration
CREATE OR REPLACE FUNCTION update_view_duration(
  p_view_id UUID,
  p_duration INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE boat_views 
  SET view_duration = p_duration
  WHERE id = p_view_id;
  
  -- Update average duration in analytics
  UPDATE boat_analytics
  SET average_view_duration = (
    SELECT AVG(view_duration)::INTEGER
    FROM boat_views
    WHERE boat_views.boat_id = boat_analytics.boat_id
    AND DATE(boat_views.viewed_at) = boat_analytics.date
    AND view_duration IS NOT NULL
  )
  WHERE boat_id = (SELECT boat_id FROM boat_views WHERE id = p_view_id)
  AND date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get boat statistics for a specific period
CREATE OR REPLACE FUNCTION get_boat_stats(
  p_boat_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
  total_views BIGINT,
  unique_viewers BIGINT,
  total_saves BIGINT,
  total_messages BIGINT,
  avg_view_duration INTEGER,
  daily_stats JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(ba.view_count), 0) as total_views,
    COALESCE(SUM(ba.unique_viewers), 0) as unique_viewers,
    COALESCE(SUM(ba.save_count), 0) as total_saves,
    COALESCE(SUM(ba.message_count), 0) as total_messages,
    COALESCE(AVG(ba.average_view_duration)::INTEGER, 0) as avg_view_duration,
    COALESCE(
      json_agg(
        json_build_object(
          'date', ba.date,
          'views', ba.view_count,
          'unique_viewers', ba.unique_viewers,
          'saves', ba.save_count,
          'messages', ba.message_count
        ) ORDER BY ba.date
      ) FILTER (WHERE ba.date IS NOT NULL), 
      '[]'::json
    ) as daily_stats
  FROM boat_analytics ba
  WHERE ba.boat_id = p_boat_id
  AND ba.date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update analytics when a boat is saved
CREATE OR REPLACE FUNCTION update_save_analytics() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment save count
    INSERT INTO boat_analytics (boat_id, date, save_count)
    VALUES (NEW.boat_id, CURRENT_DATE, 1)
    ON CONFLICT (boat_id, date) 
    DO UPDATE SET 
      save_count = boat_analytics.save_count + 1,
      updated_at = NOW();
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement save count
    UPDATE boat_analytics 
    SET save_count = GREATEST(save_count - 1, 0),
        updated_at = NOW()
    WHERE boat_id = OLD.boat_id 
    AND date = CURRENT_DATE;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_save_analytics_trigger
AFTER INSERT OR DELETE ON saved_boats
FOR EACH ROW
EXECUTE FUNCTION update_save_analytics();

-- Trigger to update analytics when a message is sent
CREATE OR REPLACE FUNCTION update_message_analytics() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.sender_id != (
    SELECT buyer_id FROM conversations WHERE id = NEW.conversation_id
  ) THEN
    -- Only count first message from buyer
    IF NOT EXISTS (
      SELECT 1 FROM messages 
      WHERE conversation_id = NEW.conversation_id 
      AND sender_id = NEW.sender_id
      AND id != NEW.id
    ) THEN
      UPDATE boat_analytics 
      SET message_count = message_count + 1,
          updated_at = NOW()
      WHERE boat_id = (
        SELECT boat_id FROM conversations WHERE id = NEW.conversation_id
      )
      AND date = CURRENT_DATE;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_message_analytics_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_message_analytics();