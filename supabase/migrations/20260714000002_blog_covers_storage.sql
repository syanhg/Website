-- Create public storage bucket for blog cover images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-covers', 'blog-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Public can view cover images
CREATE POLICY "Public can view blog covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blog-covers');

-- Authenticated (admin) can upload
CREATE POLICY "Authenticated can upload blog covers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'blog-covers');

-- Authenticated (admin) can delete
CREATE POLICY "Authenticated can delete blog covers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'blog-covers');
