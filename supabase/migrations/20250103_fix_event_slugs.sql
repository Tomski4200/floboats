-- Fix the event slug generation function as well
DROP FUNCTION IF EXISTS generate_event_slug(TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE);

-- Function to generate event slug (FIXED VERSION)
CREATE OR REPLACE FUNCTION generate_event_slug(
    p_title TEXT,
    p_city TEXT,
    p_state TEXT,
    p_event_date TIMESTAMP WITH TIME ZONE
) RETURNS TEXT AS $$
DECLARE
    v_slug TEXT;
    v_title_part TEXT;
    v_location_part TEXT;
    v_date_part TEXT;
    v_counter INTEGER := 0;
    v_final_slug TEXT;
BEGIN
    -- Extract first 4 words from title
    v_title_part := array_to_string(
        (string_to_array(p_title, ' '))[1:4], 
        ' '
    );
    
    -- Create location part
    v_location_part := p_city || ' ' || p_state;
    
    -- Create date part (month name and year)
    v_date_part := to_char(p_event_date, 'Month YYYY');
    
    -- Combine all parts
    v_slug := v_title_part || ' ' || v_location_part || ' ' || v_date_part;
    
    -- Replace spaces and special characters with hyphens
    v_slug := regexp_replace(v_slug, '[^a-zA-Z0-9]+', '-', 'g');
    
    -- Convert to lowercase
    v_slug := lower(v_slug);
    
    -- Clean up multiple hyphens and trim
    v_slug := regexp_replace(v_slug, '-+', '-', 'g');
    v_slug := trim(both '-' from v_slug);
    
    -- Check for uniqueness and add counter if needed
    v_final_slug := v_slug;
    LOOP
        -- Check if slug exists
        IF NOT EXISTS (SELECT 1 FROM events WHERE slug = v_final_slug) THEN
            EXIT;
        END IF;
        
        v_counter := v_counter + 1;
        v_final_slug := v_slug || '-' || v_counter;
    END LOOP;
    
    RETURN v_final_slug;
END;
$$ LANGUAGE plpgsql;

-- Re-update all existing events with properly generated slugs
UPDATE events 
SET slug = generate_event_slug(
    title,
    COALESCE(location_city, (SELECT city FROM event_venues WHERE id = events.venue_id)),
    COALESCE(location_state, (SELECT state FROM event_venues WHERE id = events.venue_id)),
    event_start
);

-- Show sample of corrected event slugs
SELECT id, title, slug, event_start
FROM events
WHERE status = 'published'
ORDER BY event_start
LIMIT 10;