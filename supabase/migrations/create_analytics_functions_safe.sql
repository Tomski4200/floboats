-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_boat_stats(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS track_boat_view(UUID, UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS update_view_duration(UUID, INTEGER);

-- Create function to get boat statistics
CREATE OR REPLACE FUNCTION get_boat_stats(
  p_boat_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_views BIGINT,
  unique_viewers BIGINT,
  total_saves BIGINT,
  total_messages BIGINT,
  avg_view_duration NUMERIC,
  daily_stats JSON
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH view_stats AS (
    SELECT 
      COUNT(*)::BIGINT as view_count,
      COUNT(DISTINCT COALESCE(viewer_id, session_id))::BIGINT as unique_viewer_count,
      AVG(view_duration)::NUMERIC as avg_duration
    FROM boat_views
    WHERE boat_id = p_boat_id
      AND DATE(viewed_at) BETWEEN p_start_date AND p_end_date
  ),
  save_stats AS (
    SELECT COUNT(*)::BIGINT as save_count
    FROM saved_boats
    WHERE boat_id = p_boat_id
      AND DATE(saved_at) BETWEEN p_start_date AND p_end_date
  ),
  message_stats AS (
    SELECT COUNT(*)::BIGINT as message_count
    FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    WHERE c.boat_id = p_boat_id
      AND DATE(m.created_at) BETWEEN p_start_date AND p_end_date
  ),
  daily_breakdown AS (
    SELECT 
      json_agg(
        json_build_object(
          'date', date,
          'views', view_count,
          'unique_viewers', unique_viewers,
          'saves', save_count,
          'messages', message_count
        ) ORDER BY date
      ) as daily_data
    FROM boat_analytics
    WHERE boat_id = p_boat_id
      AND date BETWEEN p_start_date AND p_end_date
  )
  SELECT 
    COALESCE(v.view_count, 0) as total_views,
    COALESCE(v.unique_viewer_count, 0) as unique_viewers,
    COALESCE(s.save_count, 0) as total_saves,
    COALESCE(m.message_count, 0) as total_messages,
    COALESCE(v.avg_duration, 0) as avg_view_duration,
    COALESCE(d.daily_data, '[]'::json) as daily_stats
  FROM view_stats v
  CROSS JOIN save_stats s
  CROSS JOIN message_stats m
  CROSS JOIN daily_breakdown d;
END;
$$;

-- Create function to track boat views
CREATE OR REPLACE FUNCTION track_boat_view(
  p_boat_id UUID,
  p_viewer_id UUID DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_view_id UUID;
  v_today DATE;
BEGIN
  -- Insert the view record
  INSERT INTO boat_views (boat_id, viewer_id, user_agent, referrer, session_id)
  VALUES (p_boat_id, p_viewer_id, p_user_agent, p_referrer, p_session_id)
  RETURNING id INTO v_view_id;
  
  -- Update today's analytics
  v_today := CURRENT_DATE;
  
  INSERT INTO boat_analytics (boat_id, date, view_count, unique_viewers)
  VALUES (
    p_boat_id, 
    v_today, 
    1,
    1
  )
  ON CONFLICT (boat_id, date) 
  DO UPDATE SET
    view_count = boat_analytics.view_count + 1,
    unique_viewers = (
      SELECT COUNT(DISTINCT COALESCE(viewer_id, session_id))
      FROM boat_views
      WHERE boat_id = p_boat_id
        AND DATE(viewed_at) = v_today
    ),
    updated_at = CURRENT_TIMESTAMP;
  
  RETURN v_view_id;
END;
$$;

-- Create function to update view duration
CREATE OR REPLACE FUNCTION update_view_duration(
  p_view_id UUID,
  p_duration INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE boat_views
  SET view_duration = p_duration
  WHERE id = p_view_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_boat_stats TO authenticated;
GRANT EXECUTE ON FUNCTION track_boat_view TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_view_duration TO authenticated, anon;