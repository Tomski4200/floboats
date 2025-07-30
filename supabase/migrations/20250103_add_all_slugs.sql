-- Comprehensive migration to add slug support to both events and venues
-- This combines all the slug-related migrations into one file

-- ========================================
-- PART 1: ADD SLUG COLUMNS
-- ========================================

-- Add slug column to event_venues table
ALTER TABLE event_venues ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Add slug column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_venues_slug ON event_venues(slug);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);

-- ========================================
-- PART 2: CREATE SLUG GENERATION FUNCTIONS
-- ========================================

-- Drop old functions if they exist
DROP FUNCTION IF EXISTS generate_venue_slug(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS generate_event_slug(TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE);

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

-- ========================================
-- PART 3: CREATE TRIGGERS
-- ========================================

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

-- ========================================
-- PART 4: POPULATE EXISTING RECORDS
-- ========================================

-- Update existing venues with slugs
UPDATE event_venues 
SET slug = generate_venue_slug(name, city, state)
WHERE slug IS NULL;

-- Update existing events with slugs
UPDATE events 
SET slug = generate_event_slug(
    title,
    COALESCE(location_city, (SELECT city FROM event_venues WHERE id = events.venue_id)),
    COALESCE(location_state, (SELECT state FROM event_venues WHERE id = events.venue_id)),
    event_start
)
WHERE slug IS NULL;

-- ========================================
-- PART 5: MAKE SLUGS REQUIRED
-- ========================================

-- Make slug NOT NULL after populating existing records
ALTER TABLE event_venues ALTER COLUMN slug SET NOT NULL;
ALTER TABLE events ALTER COLUMN slug SET NOT NULL;

-- ========================================
-- PART 6: SHOW RESULTS
-- ========================================

-- Show sample of venue slugs
SELECT 'VENUE SLUGS:' as section;
SELECT id, name, city, state, slug
FROM event_venues
ORDER BY name
LIMIT 10;

-- Show sample of event slugs  
SELECT 'EVENT SLUGS:' as section;
SELECT id, title, slug, event_start
FROM events
WHERE status = 'published'
ORDER BY event_start
LIMIT 10;

-- Show counts
SELECT 'SLUG COUNTS:' as section;
SELECT 
    'events' as table_name,
    COUNT(*) as total_rows,
    COUNT(slug) as rows_with_slug
FROM events
WHERE status = 'published'
UNION ALL
SELECT 
    'event_venues' as table_name,
    COUNT(*) as total_rows,
    COUNT(slug) as rows_with_slug
FROM event_venues;