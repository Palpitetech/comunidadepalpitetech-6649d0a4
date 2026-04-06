
-- P0: Fix post-media storage INSERT policy to restrict to user's own folder
DROP POLICY IF EXISTS "Users can upload post media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload post media" ON storage.objects;
DROP POLICY IF EXISTS "post-media upload" ON storage.objects;

-- Find and drop any INSERT policy on post-media bucket
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
    AND cmd = 'INSERT'
    AND qual::text LIKE '%post-media%' OR with_check::text LIKE '%post-media%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Create restricted INSERT policy - users can only upload to their own folder
CREATE POLICY "Users can upload to own folder in post-media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- P3: Restrict post_comments SELECT to authenticated only
DROP POLICY IF EXISTS "Comentarios sao visiveis para todos" ON public.post_comments;
CREATE POLICY "Comentarios visiveis para autenticados"
ON public.post_comments
FOR SELECT
TO authenticated
USING (true);

-- Also allow service_role to read comments
CREATE POLICY "Service role pode ler post_comments"
ON public.post_comments
FOR SELECT
USING (auth.role() = 'service_role');

-- P2: Add public read for faixas_premiacao
CREATE POLICY "Leitura publica faixas_premiacao"
ON public.faixas_premiacao
FOR SELECT
USING (true);
