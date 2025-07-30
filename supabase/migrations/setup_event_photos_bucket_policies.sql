-- Set up RLS policies for the event-photos bucket

-- First, check if the bucket exists
SELECT * FROM storage.buckets WHERE id = 'event-photos';

-- Create bucket if it doesn't exist (optional, since you already created it)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-photos',
  'event-photos',
  true, -- Public bucket for read access
  2097152, -- 2MB limit (2 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view event photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload event photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own event photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own event photos" ON storage.objects;

-- Create new policies

-- 1. Anyone can view event photos (since bucket is public)
CREATE POLICY "Anyone can view event photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-photos');

-- 2. Authenticated users can upload event photos
CREATE POLICY "Authenticated users can upload event photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-photos' 
  AND auth.uid() IS NOT NULL
);

-- 3. Users can update their own uploaded photos
CREATE POLICY "Users can update their own event photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-photos' 
  AND auth.uid() = owner
)
WITH CHECK (
  bucket_id = 'event-photos' 
  AND auth.uid() = owner
);

-- 4. Users can delete their own uploaded photos
CREATE POLICY "Users can delete their own event photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-photos' 
  AND auth.uid() = owner
);

-- Additional policy for event organizers to manage photos
-- This allows event authors and business managers to upload photos for their events
CREATE POLICY "Event organizers can manage event photos"
ON storage.objects FOR ALL
USING (
  bucket_id = 'event-photos'
  AND auth.uid() IS NOT NULL
  AND (
    -- Check if user is authenticated
    auth.uid() = owner
    OR
    -- Check if user owns an event that might use this photo
    EXISTS (
      SELECT 1 FROM events 
      WHERE author_id = auth.uid()
    )
    OR
    -- Check if user manages a business that organizes events
    EXISTS (
      SELECT 1 FROM user_business_permissions ubp
      JOIN events e ON e.organizer_business_id = ubp.business_id
      WHERE ubp.user_id = auth.uid()
      AND ubp.role IN ('owner', 'manager')
    )
  )
);