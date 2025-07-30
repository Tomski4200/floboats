-- Enable RLS on boat_photos table
ALTER TABLE boat_photos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert photos for boats they own
CREATE POLICY "Users can insert photos for their boats" ON boat_photos
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM boats 
    WHERE boats.id = boat_photos.boat_id 
    AND boats.owner_id = auth.uid()
  )
);

-- Policy: Users can view all boat photos (public viewing)
CREATE POLICY "Anyone can view boat photos" ON boat_photos
FOR SELECT 
USING (true);

-- Policy: Users can update photos for boats they own
CREATE POLICY "Users can update photos for their boats" ON boat_photos
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM boats 
    WHERE boats.id = boat_photos.boat_id 
    AND boats.owner_id = auth.uid()
  )
);

-- Policy: Users can delete photos for boats they own
CREATE POLICY "Users can delete photos for their boats" ON boat_photos
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM boats 
    WHERE boats.id = boat_photos.boat_id 
    AND boats.owner_id = auth.uid()
  )
);

-- Storage bucket policies (run these in the SQL editor after creating the bucket)
-- Note: Storage policies use a different syntax

-- Allow authenticated users to upload to their own folder
INSERT INTO storage.objects (bucket_id, name, owner, created_at, updated_at) 
VALUES ('boat-photos', '.emptyFolderPlaceholder', auth.uid(), now(), now())
ON CONFLICT DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload boat photos" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'boat-photos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to view boat photos
CREATE POLICY "Anyone can view boat photos" ON storage.objects
FOR SELECT 
USING (bucket_id = 'boat-photos');

-- Allow users to update their own photos
CREATE POLICY "Users can update their boat photos" ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'boat-photos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their boat photos" ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'boat-photos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);