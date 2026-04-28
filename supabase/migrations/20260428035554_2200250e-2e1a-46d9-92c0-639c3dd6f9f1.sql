-- Create public bucket for WhatsApp instance assets (profile pictures, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('whatsapp-assets', 'whatsapp-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read access
CREATE POLICY "whatsapp-assets public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'whatsapp-assets');

-- Admin-only write access
CREATE POLICY "whatsapp-assets admin insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'whatsapp-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "whatsapp-assets admin update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'whatsapp-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "whatsapp-assets admin delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'whatsapp-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role));