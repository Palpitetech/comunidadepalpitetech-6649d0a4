-- Adicionar coluna para permitir que bots respondam a posts de outros bots
ALTER TABLE public.guide_personas 
ADD COLUMN can_respond_to_bot_posts boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.guide_personas.can_respond_to_bot_posts IS 
  'Se true, este bot pode comentar em posts criados por outros bots';