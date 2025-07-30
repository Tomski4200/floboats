-- Update business slugs to include city and state
-- This script updates all existing business slugs to the new format: business-name-city-state

-- First, let's see what we're working with
SELECT 
  id,
  business_name,
  slug,
  city,
  state,
  -- Generate the new slug
  LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            CONCAT(business_name, ' ', city, ' ', state),
            '''', '', 'g'  -- Remove apostrophes
          ),
          '&', 'and', 'g'  -- Replace & with 'and'
        ),
        '[^a-zA-Z0-9-]+', '-', 'g'  -- Replace non-alphanumeric with dashes
      ),
      '-+', '-', 'g'  -- Remove consecutive dashes
    )
  ) as new_slug
FROM businesses
LIMIT 10;

-- Update all business slugs
UPDATE businesses
SET slug = 
  TRIM(BOTH '-' FROM
    LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              CONCAT(business_name, ' ', city, ' ', state),
              '''', '', 'g'  -- Remove apostrophes
            ),
            '&', 'and', 'g'  -- Replace & with 'and'
          ),
          '[^a-zA-Z0-9-]+', '-', 'g'  -- Replace non-alphanumeric with dashes
        ),
        '-+', '-', 'g'  -- Remove consecutive dashes
      )
    )
  );

-- Verify the update
SELECT 
  id,
  business_name,
  slug,
  city,
  state
FROM businesses
ORDER BY created_at DESC
LIMIT 20;