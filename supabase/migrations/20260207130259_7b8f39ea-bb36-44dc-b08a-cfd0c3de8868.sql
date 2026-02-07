-- Create storage bucket for bot avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('bot-avatars', 'bot-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view bot avatars (public bucket)
CREATE POLICY "Bot avatars are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'bot-avatars');

-- Policy: Only admins can upload bot avatars
CREATE POLICY "Admins can upload bot avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'bot-avatars' 
  AND has_role(auth.uid(), 'admin')
);

-- Policy: Only admins can update bot avatars
CREATE POLICY "Admins can update bot avatars"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'bot-avatars' AND has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'bot-avatars' AND has_role(auth.uid(), 'admin'));

-- Policy: Only admins can delete bot avatars
CREATE POLICY "Admins can delete bot avatars"
ON storage.objects
FOR DELETE
USING (bucket_id = 'bot-avatars' AND has_role(auth.uid(), 'admin'));