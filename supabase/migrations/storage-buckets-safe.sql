-- Check existing storage buckets
SELECT id, name, public FROM storage.buckets;

-- Create buckets only if they don't exist
DO $$
BEGIN
    -- Create avatars bucket if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('avatars', 'avatars', true);
    END IF;
    
    -- Create boats bucket if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'boats') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('boats', 'boats', true);
    END IF;
END $$;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Boat images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Boat owners can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Boat owners can update images" ON storage.objects;
DROP POLICY IF EXISTS "Boat owners can delete images" ON storage.objects;

-- Create RLS policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create RLS policies for boats bucket
CREATE POLICY "Boat images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'boats');

CREATE POLICY "Boat owners can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'boats' 
    AND auth.uid() IN (
        SELECT owner_id FROM public.boats 
        WHERE id::text = (storage.foldername(name))[1]
    )
);

CREATE POLICY "Boat owners can update images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'boats' 
    AND auth.uid() IN (
        SELECT owner_id FROM public.boats 
        WHERE id::text = (storage.foldername(name))[1]
    )
);

CREATE POLICY "Boat owners can delete images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'boats' 
    AND auth.uid() IN (
        SELECT owner_id FROM public.boats 
        WHERE id::text = (storage.foldername(name))[1]
    )
);

-- Verify the setup
SELECT 'Buckets created/verified:' as status;
SELECT id, name, public FROM storage.buckets WHERE id IN ('avatars', 'boats');

SELECT 'Policies created:' as status;
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;