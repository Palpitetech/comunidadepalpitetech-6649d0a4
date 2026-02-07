-- Adicionar coluna para responder comentários do próprio post
ALTER TABLE public.guide_personas 
ADD COLUMN can_reply_own_post_comments boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.guide_personas.can_reply_own_post_comments IS 
  'Se true, este bot pode responder a comentários feitos em seus próprios posts';