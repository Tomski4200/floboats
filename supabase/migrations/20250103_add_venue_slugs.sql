-- Add slug column to event_venues table
ALTER TABLE event_venues ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_event_venues_slug ON event_venues(slug);

-- Function to generate venue slug
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
    -- Create slug from venue name, city, and state
    v_slug := lower(
        regexp_replace(
            p_name || '-' || p_city || '-' || p_state,
            '[^a-z0-9-]', 
            '', 
            'g'
        )
    );
    
    -- Clean up multiple hyphens
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

-- Update existing venues with slugs
UPDATE event_venues 
SET slug = generate_venue_slug(name, city, state)
WHERE slug IS NULL;

-- Make slug NOT NULL after populating existing records
ALTER TABLE event_venues ALTER COLUMN slug SET NOT NULL;

-- Create trigger to automatically generate slug for new venues
CREATE OR REPLACE FUNCTION trigger_generate_venue_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_venue_slug(NEW.name, NEW.city, NEW.state);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_venue_slug_trigger
    BEFORE INSERT OR UPDATE ON event_venues
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_venue_slug();

-- Show sample of updated slugs
SELECT id, name, city, state, slug
FROM event_venues
ORDER BY name
LIMIT 10;