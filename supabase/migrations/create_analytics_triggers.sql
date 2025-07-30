-- Function to update analytics when a boat is saved
CREATE OR REPLACE FUNCTION update_analytics_on_save()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update today's save count
  INSERT INTO boat_analytics (boat_id, date, save_count)
  VALUES (
    NEW.boat_id, 
    CURRENT_DATE, 
    1
  )
  ON CONFLICT (boat_id, date) 
  DO UPDATE SET
    save_count = COALESCE(boat_analytics.save_count, 0) + 1,
    updated_at = CURRENT_TIMESTAMP;
  
  RETURN NEW;
END;
$$;

-- Function to update analytics when a message is sent
CREATE OR REPLACE FUNCTION update_analytics_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_boat_id UUID;
BEGIN
  -- Get the boat_id from the conversation
  SELECT boat_id INTO v_boat_id
  FROM conversations
  WHERE id = NEW.conversation_id;
  
  -- Only update if there's a boat associated
  IF v_boat_id IS NOT NULL THEN
    INSERT INTO boat_analytics (boat_id, date, message_count)
    VALUES (
      v_boat_id, 
      CURRENT_DATE, 
      1
    )
    ON CONFLICT (boat_id, date) 
    DO UPDATE SET
      message_count = COALESCE(boat_analytics.message_count, 0) + 1,
      updated_at = CURRENT_TIMESTAMP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER update_analytics_on_save_trigger
AFTER INSERT ON saved_boats
FOR EACH ROW
EXECUTE FUNCTION update_analytics_on_save();

CREATE TRIGGER update_analytics_on_message_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_analytics_on_message();

-- Also update analytics when a save is removed
CREATE OR REPLACE FUNCTION update_analytics_on_unsave()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Decrease today's save count
  UPDATE boat_analytics
  SET 
    save_count = GREATEST(COALESCE(save_count, 0) - 1, 0),
    updated_at = CURRENT_TIMESTAMP
  WHERE boat_id = OLD.boat_id 
    AND date = CURRENT_DATE;
  
  RETURN OLD;
END;
$$;

CREATE TRIGGER update_analytics_on_unsave_trigger
AFTER DELETE ON saved_boats
FOR EACH ROW
EXECUTE FUNCTION update_analytics_on_unsave();