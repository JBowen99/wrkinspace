-- Create the moodboard-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('moodboard-images', 'moodboard-images', true);

-- Policy to allow anyone to upload images to moodboard-images bucket
-- (since this is a collaborative space app, we allow anonymous uploads)
CREATE POLICY "Allow public uploads to moodboard-images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'moodboard-images'
);

-- Policy to allow anyone to view images from moodboard-images bucket
-- (public bucket, so images should be viewable by anyone)
CREATE POLICY "Allow public access to moodboard-images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'moodboard-images'
);

-- Policy to allow deletion of images from moodboard-images bucket
-- (for cleanup when moodboard items are deleted)
CREATE POLICY "Allow public delete from moodboard-images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'moodboard-images'
);

-- Policy to allow updates to images in moodboard-images bucket
-- (in case we need to update metadata)
CREATE POLICY "Allow public updates to moodboard-images" ON storage.objects
FOR UPDATE WITH CHECK (
  bucket_id = 'moodboard-images'
); 