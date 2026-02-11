-- Add image_url columns to venues and bays
ALTER TABLE venues ADD COLUMN image_url TEXT;
ALTER TABLE bays ADD COLUMN image_url TEXT;

-- Create the venue-images storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('venue-images', 'venue-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users can upload to venue-images
CREATE POLICY "Authenticated users can upload venue images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'venue-images');

-- Authenticated users can update their own uploads
CREATE POLICY "Authenticated users can update venue images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'venue-images');

-- Authenticated users can delete their own uploads
CREATE POLICY "Authenticated users can delete venue images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'venue-images');

-- Anyone can view venue images (public bucket)
CREATE POLICY "Anyone can view venue images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'venue-images');
