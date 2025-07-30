-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS event_likes CASCADE;
DROP TABLE IF EXISTS event_attendees CASCADE;

-- Create event_likes table for tracking which users have liked events
CREATE TABLE event_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(event_id, user_id)
);

-- Create event_attendees table for tracking RSVPs
CREATE TABLE event_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'interested', 'not_going')),
    rsvp_date TIMESTAMPTZ DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(event_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_event_likes_event_id ON event_likes(event_id);
CREATE INDEX idx_event_likes_user_id ON event_likes(user_id);
CREATE INDEX idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_user_id ON event_attendees(user_id);
CREATE INDEX idx_event_attendees_status ON event_attendees(status);

-- Enable RLS
ALTER TABLE event_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_likes
-- Anyone can view likes
CREATE POLICY "Anyone can view event likes" ON event_likes
    FOR SELECT USING (true);

-- Users can only manage their own likes
CREATE POLICY "Users can manage their own likes" ON event_likes
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for event_attendees
-- Anyone can view attendees (for public event attendance counts)
CREATE POLICY "Anyone can view event attendees" ON event_attendees
    FOR SELECT USING (true);

-- Users can only manage their own attendance
CREATE POLICY "Users can manage their own attendance" ON event_attendees
    FOR ALL USING (auth.uid() = user_id);

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_event_like_count(UUID);
DROP FUNCTION IF EXISTS get_event_attendee_count(UUID, VARCHAR);

-- Function to get like count for an event
CREATE FUNCTION get_event_like_count(event_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM event_likes WHERE event_id = event_id_param);
END;
$$ LANGUAGE plpgsql;

-- Function to get attendee count by status
CREATE FUNCTION get_event_attendee_count(event_id_param UUID, status_param VARCHAR DEFAULT NULL)
RETURNS INTEGER AS $$
BEGIN
    IF status_param IS NULL THEN
        RETURN (SELECT COUNT(*) FROM event_attendees WHERE event_id = event_id_param);
    ELSE
        RETURN (SELECT COUNT(*) FROM event_attendees WHERE event_id = event_id_param AND status = status_param);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS update_event_attendee_count_trigger ON event_attendees;
DROP FUNCTION IF EXISTS update_event_attendee_count();

-- Trigger to update event attendee_count when attendees change
CREATE FUNCTION update_event_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE events 
        SET attendee_count = get_event_attendee_count(NEW.event_id, 'going')
        WHERE id = NEW.event_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE events 
        SET attendee_count = get_event_attendee_count(OLD.event_id, 'going')
        WHERE id = OLD.event_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_attendee_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON event_attendees
FOR EACH ROW EXECUTE FUNCTION update_event_attendee_count();

-- Drop existing views if they exist
DROP VIEW IF EXISTS event_likes_with_profile;
DROP VIEW IF EXISTS event_attendees_with_profile;

-- Add profile info view for attendees and likes (includes user details)
-- Using CONCAT to create full_name from first_name and last_name
CREATE VIEW event_likes_with_profile AS
SELECT 
    el.*,
    COALESCE(NULLIF(CONCAT(p.first_name, ' ', p.last_name), ' '), p.username) as full_name,
    p.avatar_url,
    p.username
FROM event_likes el
JOIN profiles p ON el.user_id = p.id;

CREATE VIEW event_attendees_with_profile AS
SELECT 
    ea.*,
    COALESCE(NULLIF(CONCAT(p.first_name, ' ', p.last_name), ' '), p.username) as full_name,
    p.avatar_url,
    p.username
FROM event_attendees ea
JOIN profiles p ON ea.user_id = p.id;

-- Grant permissions
GRANT SELECT ON event_likes_with_profile TO authenticated;
GRANT SELECT ON event_attendees_with_profile TO authenticated;

-- Update all existing events to have correct attendee count (in case there are any)
UPDATE events 
SET attendee_count = COALESCE((
    SELECT COUNT(*) 
    FROM event_attendees 
    WHERE event_id = events.id AND status = 'going'
), 0);