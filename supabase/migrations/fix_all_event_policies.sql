-- Complete fix for event-related policies

-- 1. First, check if RLS is enabled on the tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('events', 'event_attendees', 'event_categories');

-- 2. Disable RLS temporarily on event_attendees to break any circular dependencies
ALTER TABLE event_attendees DISABLE ROW LEVEL SECURITY;

-- 3. Drop ALL policies on events table
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'events'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON events', pol.policyname);
    END LOOP;
END $$;

-- 4. Drop ALL policies on event_attendees table
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'event_attendees'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON event_attendees', pol.policyname);
    END LOOP;
END $$;

-- 5. Create a single simple policy for events
CREATE POLICY "events_select_policy"
ON events FOR SELECT
USING (
    event_visibility = 'public'
    OR auth.uid() IS NOT NULL  -- Any authenticated user can see all events for now
);

-- 6. Re-enable RLS on event_attendees with a simple policy
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_attendees_select_policy"
ON event_attendees FOR SELECT
USING (true);  -- Allow all reads for now

-- 7. Verify the policies
SELECT 
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('events', 'event_attendees')
ORDER BY tablename, policyname;