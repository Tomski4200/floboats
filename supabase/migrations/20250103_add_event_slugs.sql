-- Add slug column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);

-- Function to generate event slug
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
    v_title_part := lower(
        regexp_replace(
            array_to_string(
                (string_to_array(p_title, ' '))[1:4], 
                '-'
            ),
            '[^a-z0-9-]', 
            '', 
            'g'
        )
    );
    
    -- Create location part
    v_location_part := lower(
        regexp_replace(
            p_city || '-' || p_state,
            '[^a-z0-9-]', 
            '', 
            'g'
        )
    );
    
    -- Create date part (month name and year)
    v_date_part := lower(
        to_char(p_event_date, 'month-yyyy')
    );
    -- Remove any extra spaces
    v_date_part := regexp_replace(v_date_part, '\s+', '', 'g');
    
    -- Combine all parts
    v_slug := v_title_part || '-' || v_location_part || '-' || v_date_part;
    
    -- Clean up multiple hyphens
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

-- Update existing events with slugs
UPDATE events 
SET slug = generate_event_slug(
    title,
    COALESCE(location_city, (SELECT city FROM event_venues WHERE id = events.venue_id)),
    COALESCE(location_state, (SELECT state FROM event_venues WHERE id = events.venue_id)),
    event_start
)
WHERE slug IS NULL;

-- Make slug NOT NULL after populating existing records
ALTER TABLE events ALTER COLUMN slug SET NOT NULL;

-- Create trigger to automatically generate slug for new events
CREATE OR REPLACE FUNCTION trigger_generate_event_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_event_slug(
            NEW.title,
            COALESCE(NEW.location_city, (SELECT city FROM event_venues WHERE id = NEW.venue_id)),
            COALESCE(NEW.location_state, (SELECT state FROM event_venues WHERE id = NEW.venue_id)),
            NEW.event_start
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_event_slug_trigger
    BEFORE INSERT OR UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_event_slug();

-- Show sample of updated slugs
SELECT id, title, slug, event_start, location_city, location_state
FROM events
WHERE status = 'published'
ORDER BY event_start
LIMIT 10;