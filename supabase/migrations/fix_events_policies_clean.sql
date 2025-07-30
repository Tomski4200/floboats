-- Clean up events policies to fix any issues

-- First, drop all existing policies on events table
DROP POLICY IF EXISTS "Authors can manage their own events" ON events;
DROP POLICY IF EXISTS "Business managers can manage their events" ON events;
DROP POLICY IF EXISTS "Private events viewable by attendees" ON events;
DROP POLICY IF EXISTS "Public events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Temporary - All events visible" ON events;

-- Create clean, non-conflicting policies
-- 1. Public events are viewable by everyone
CREATE POLICY "Public events viewable by all"
ON events FOR SELECT
USING (event_visibility = 'public');

-- 2. Private events viewable by author or attendees
CREATE POLICY "Private events viewable by participants"
ON events FOR SELECT
USING (
  event_visibility = 'private' 
  AND (
    author_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM event_attendees 
      WHERE event_attendees.event_id = events.id 
      AND event_attendees.user_id = auth.uid()
    )
  )
);

-- 3. Authors can manage their own events
CREATE POLICY "Authors manage own events"
ON events FOR ALL
USING (author_id = auth.uid());

-- 4. Business managers can manage their business events
CREATE POLICY "Business managers manage events"
ON events FOR ALL
USING (
  organizer_business_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_business_permissions
    WHERE user_business_permissions.business_id = events.organizer_business_id
    AND user_business_permissions.user_id = auth.uid()
    AND user_business_permissions.role IN ('owner', 'manager')
  )
);

-- Now check event_attendees policies
SELECT 
    policyname,
    cmd,
    qual as condition
FROM pg_policies 
WHERE tablename = 'event_attendees';

-- Drop any problematic policies on event_attendees
DROP POLICY IF EXISTS "Attendees can view other attendees for public events" ON event_attendees;
DROP POLICY IF EXISTS "Users can view attendees for events" ON event_attendees;

-- Create simple policy for event_attendees
CREATE POLICY "View attendees for accessible events"
ON event_attendees FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_attendees.event_id
    AND (
      events.event_visibility = 'public'
      OR events.author_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM event_attendees ea2
        WHERE ea2.event_id = events.id
        AND ea2.user_id = auth.uid()
      )
    )
  )
);

-- Verify the new policies
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('events', 'event_attendees')
ORDER BY tablename, policyname;