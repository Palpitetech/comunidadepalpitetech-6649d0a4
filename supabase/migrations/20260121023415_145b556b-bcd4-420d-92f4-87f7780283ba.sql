-- Adicionar novos campos na tabela postagens para suportar a comunidade completa
ALTER TABLE public.postagens
ADD COLUMN IF NOT EXISTS titulo TEXT,
ADD COLUMN IF NOT EXISTS loteria_tag VARCHAR(50) DEFAULT 'Lotofácil',
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS external_link_url TEXT,
ADD COLUMN IF NOT EXISTS external_link_text TEXT,
ADD COLUMN IF NOT EXISTS tool_snapshot BOOLEAN DEFAULT false;

-- Criar tabela de curtidas
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.postagens(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes sao visiveis para todos"
  ON public.post_likes FOR SELECT USING (true);

CREATE POLICY "Usuarios podem criar seus proprios likes"
  ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios podem remover seus proprios likes"
  ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- Criar tabela de comentarios
CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.postagens(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comentarios sao visiveis para todos"
  ON public.post_comments FOR SELECT USING (true);

CREATE POLICY "Usuarios podem criar comentarios"
  ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios podem editar seus comentarios"
  ON public.post_comments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuarios e admins podem deletar comentarios"
  ON public.post_comments FOR DELETE 
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Trigger para atualizar contador de curtidas
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.postagens SET curtidas = COALESCE(curtidas, 0) + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.postagens SET curtidas = GREATEST(COALESCE(curtidas, 0) - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_like_change
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- Trigger para atualizar contador de comentarios
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.postagens SET respostas_count = COALESCE(respostas_count, 0) + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.postagens SET respostas_count = GREATEST(COALESCE(respostas_count, 0) - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_comment_change
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- Criar bucket para midia de posts
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-media', 'post-media', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Usuarios autenticados podem fazer upload
CREATE POLICY "Usuarios podem fazer upload de midia"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'post-media' AND auth.role() = 'authenticated');

-- Policy: Midia publica para leitura
CREATE POLICY "Midia de posts e publica"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-media');

-- Policy: Usuarios podem deletar sua propria midia
CREATE POLICY "Usuarios podem deletar sua midia"
ON storage.objects FOR DELETE
USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);