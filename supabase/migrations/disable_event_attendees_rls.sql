-- Temporarily disable RLS on event_attendees to fix infinite recursion
ALTER TABLE event_attendees DISABLE ROW LEVEL SECURITY;

-- Check if it's disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'event_attendees';