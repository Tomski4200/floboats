-- Fix the infinite recursion in event_attendees policy

-- First, let's see what policies exist
SELECT 
    policyname,
    cmd,
    qual as condition
FROM pg_policies 
WHERE tablename = 'event_attendees';

-- Drop the problematic policy
DROP POLICY IF EXISTS "Attendees can view other attendees for public events" ON event_attendees;

-- Create a simpler policy that avoids recursion
CREATE POLICY "Users can view attendees for events"
ON event_attendees FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM events 
        WHERE events.id = event_attendees.event_id
        AND events.event_visibility = 'public'
    )
);

-- Also check and fix events policies if needed
SELECT 
    policyname,
    cmd,
    qual as condition
FROM pg_policies 
WHERE tablename = 'events';