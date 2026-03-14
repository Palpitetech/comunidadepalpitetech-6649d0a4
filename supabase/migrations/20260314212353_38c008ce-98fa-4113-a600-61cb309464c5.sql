
-- Adicionar campo PDF na tabela boloes
ALTER TABLE boloes ADD COLUMN IF NOT EXISTS pdf_url text;

-- Criar bucket para PDFs de bolões
INSERT INTO storage.buckets (id, name, public)
VALUES ('boloes-pdfs', 'boloes-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: admin faz upload
CREATE POLICY "Admin upload boloes pdfs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'boloes-pdfs'
  AND public.has_role(auth.uid(), 'admin')
);

-- Policy: autenticado lê
CREATE POLICY "Autenticado le boloes pdfs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'boloes-pdfs');
