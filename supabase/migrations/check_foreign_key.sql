-- Check foreign key constraints on events table
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='events'
AND kcu.column_name = 'organizer_business_id';

-- Check if all organizer_business_id values exist in businesses table
SELECT 
    e.id,
    e.title,
    e.organizer_business_id,
    b.id as business_id,
    b.business_name
FROM events e
LEFT JOIN businesses b ON e.organizer_business_id = b.id
WHERE e.organizer_business_id IS NOT NULL;