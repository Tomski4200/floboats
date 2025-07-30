-- Drop ALL versions of the analytics functions regardless of their signatures
-- This will clean up any duplicate function definitions

-- Drop all versions of track_boat_view
DROP FUNCTION IF EXISTS track_boat_view CASCADE;
DROP FUNCTION IF EXISTS track_boat_view(UUID) CASCADE;
DROP FUNCTION IF EXISTS track_boat_view(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS track_boat_view(UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS track_boat_view(UUID, UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS track_boat_view(UUID, UUID, TEXT, TEXT, TEXT) CASCADE;

-- Drop all versions of get_boat_stats
DROP FUNCTION IF EXISTS get_boat_stats CASCADE;
DROP FUNCTION IF EXISTS get_boat_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_boat_stats(UUID, DATE) CASCADE;
DROP FUNCTION IF EXISTS get_boat_stats(UUID, DATE, DATE) CASCADE;

-- Drop all versions of update_view_duration
DROP FUNCTION IF EXISTS update_view_duration CASCADE;
DROP FUNCTION IF EXISTS update_view_duration(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_view_duration(UUID, INTEGER) CASCADE;

-- You can also check what functions exist with this query:
-- SELECT proname, pg_get_function_identity_arguments(oid) 
-- FROM pg_proc 
-- WHERE proname IN ('track_boat_view', 'get_boat_stats', 'update_view_duration');