-- Drop the old function and create a fixed version
DROP FUNCTION IF EXISTS generate_venue_slug(TEXT, TEXT, TEXT);

-- Function to generate venue slug (FIXED VERSION)
CREATE OR REPLACE FUNCTION generate_venue_slug(
    p_name TEXT,
    p_city TEXT,
    p_state TEXT
) RETURNS TEXT AS $$
DECLARE
    v_slug TEXT;
    v_counter INTEGER := 0;
    v_final_slug TEXT;
BEGIN
    -- First, replace spaces with hyphens, then lowercase, then remove special chars
    v_slug := p_name || ' ' || p_city || ' ' || p_state;
    
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
        IF NOT EXISTS (SELECT 1 FROM event_venues WHERE slug = v_final_slug) THEN
            EXIT;
        END IF;
        
        v_counter := v_counter + 1;
        v_final_slug := v_slug || '-' || v_counter;
    END LOOP;
    
    RETURN v_final_slug;
END;
$$ LANGUAGE plpgsql;

-- Re-update all existing venues with properly generated slugs
UPDATE event_venues 
SET slug = generate_venue_slug(name, city, state);

-- Show the corrected slugs
SELECT id, name, city, state, slug
FROM event_venues
ORDER BY name
LIMIT 20;