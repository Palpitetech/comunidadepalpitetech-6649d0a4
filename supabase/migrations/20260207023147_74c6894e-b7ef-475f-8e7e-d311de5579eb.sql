-- Adicionar colunas de autor especializado
ALTER TABLE public.guide_personas 
ADD COLUMN is_strategy_author boolean NOT NULL DEFAULT false,
ADD COLUMN is_free_tips_author boolean NOT NULL DEFAULT false;

-- Comentários explicativos
COMMENT ON COLUMN public.guide_personas.is_strategy_author IS 
  'Se true, este bot publica posts ensinando estratégias de jogo';

COMMENT ON COLUMN public.guide_personas.is_free_tips_author IS 
  'Se true, este bot publica palpites grátis com explicação da estratégia';