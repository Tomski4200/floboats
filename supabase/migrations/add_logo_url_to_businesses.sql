-- Add logo_url column to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add a comment to the column
COMMENT ON COLUMN businesses.logo_url IS 'URL to the business logo image';

-- Optionally, set some sample logo URLs for the event organizer businesses
UPDATE businesses 
SET logo_url = CASE 
    WHEN business_name = 'Miami International Boat Show LLC' THEN 'https://placeholder.com/logos/miami-boat-show.png'
    WHEN business_name = 'Bahia Mar Marina Events' THEN 'https://placeholder.com/logos/bahia-mar.png'
    WHEN business_name = 'Florida Keys Fishing Tournaments' THEN 'https://placeholder.com/logos/keys-fishing.png'
    WHEN business_name = 'Palm Beach Maritime Events' THEN 'https://placeholder.com/logos/palm-beach-maritime.png'
    WHEN business_name = 'Tampa Bay Boat Races Inc' THEN 'https://placeholder.com/logos/tampa-boat-races.png'
    WHEN business_name = 'Space Coast Marine Festival' THEN 'https://placeholder.com/logos/space-coast-marine.png'
    WHEN business_name = 'Naples Waterfront Events' THEN 'https://placeholder.com/logos/naples-waterfront.png'
    WHEN business_name = 'Everglades Adventure Tours' THEN 'https://placeholder.com/logos/everglades-tours.png'
    WHEN business_name = 'Sarasota Bay Yachting Events' THEN 'https://placeholder.com/logos/sarasota-yachting.png'
    WHEN business_name = 'Jacksonville Marine Expo' THEN 'https://placeholder.com/logos/jax-marine-expo.png'
    ELSE logo_url
END
WHERE business_name IN (
    'Miami International Boat Show LLC',
    'Bahia Mar Marina Events',
    'Florida Keys Fishing Tournaments',
    'Palm Beach Maritime Events',
    'Tampa Bay Boat Races Inc',
    'Space Coast Marine Festival',
    'Naples Waterfront Events',
    'Everglades Adventure Tours',
    'Sarasota Bay Yachting Events',
    'Jacksonville Marine Expo'
);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'businesses' AND column_name = 'logo_url';