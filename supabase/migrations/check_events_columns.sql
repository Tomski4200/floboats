-- Check events table columns
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable,
    generation_expression
FROM information_schema.columns
WHERE table_name = 'events'
ORDER BY ordinal_position;

-- Check if attendee_count is a generated column
SELECT 
    attname as column_name,
    attgenerated as is_generated
FROM pg_attribute
WHERE attrelid = 'events'::regclass
AND attname = 'attendee_count';