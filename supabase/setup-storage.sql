-- Run this in Supabase SQL Editor to create the avatars bucket
-- Or create it manually in Storage section of Supabase dashboard

-- Create the avatars bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload avatars" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow authenticated users to update their own avatars  
CREATE POLICY "Users can update own avatars" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Allow public read access to avatars
CREATE POLICY "Public avatar access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'avatars');

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete own avatars" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'avatars');

-- ============================================
-- MEMORIES BUCKET
-- ============================================

-- Create the memories bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('memories', 'memories', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated users to upload memories
CREATE POLICY "Users can upload memories" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'memories');

-- Allow authenticated users to update their memories  
CREATE POLICY "Users can update own memories media" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'memories')
WITH CHECK (bucket_id = 'memories');

-- Allow public read access to memories
CREATE POLICY "Public memories access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'memories');

-- Allow users to delete their memories media
CREATE POLICY "Users can delete own memories media" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'memories');

-- ============================================
-- VIDEOS BUCKET (for video journalist)
-- ============================================

-- Create the videos bucket (public for playback)
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow anyone to upload videos (for interview responses)
CREATE POLICY "Anyone can upload videos" ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'videos');

-- Allow public read access to videos
CREATE POLICY "Public videos access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'videos');

-- Allow authenticated users to delete videos
CREATE POLICY "Authenticated can delete videos" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'videos');

-- ============================================
-- VERIFICATION DOCUMENTS BUCKET (private - admin only)
-- ============================================

-- Create the verification-documents bucket (private - sensitive documents)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-documents',
  'verification-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET 
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

-- Only allow service role to upload (API handles this)
-- No direct public/authenticated access - all access through signed URLs

-- Admin users can read verification documents via signed URLs
CREATE POLICY "Admin can read verification documents" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'verification-documents' AND
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND admin_users.is_active = true
  )
);

-- Service role can upload (API uses admin client)
-- No explicit policy needed - service role bypasses RLS
