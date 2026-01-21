-- Adicionar coluna parent_id para suportar respostas aninhadas (threads)
ALTER TABLE public.post_comments 
ADD COLUMN parent_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE;

-- Índice para performance ao buscar respostas
CREATE INDEX idx_post_comments_parent_id ON public.post_comments(parent_id);

-- Comentário explicativo
COMMENT ON COLUMN public.post_comments.parent_id IS 
  'ID do comentário pai para threads. NULL = comentário raiz';