-- Adicionar novas colunas para automação e configuração de IA
ALTER TABLE public.guide_personas 
ADD COLUMN IF NOT EXISTS ai_model VARCHAR DEFAULT 'google/gemini-3-flash-preview',
ADD COLUMN IF NOT EXISTS post_schedule JSONB DEFAULT '{"horarios": ["12:00", "23:00"], "dias": [1,3,5]}'::jsonb,
ADD COLUMN IF NOT EXISTS auto_reply_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS max_chars_post INTEGER DEFAULT 400,
ADD COLUMN IF NOT EXISTS max_chars_comment INTEGER DEFAULT 280,
ADD COLUMN IF NOT EXISTS is_roundtable_author BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_create_posts BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS total_posts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_comments INTEGER DEFAULT 0;

-- Adicionar índice para bots ativos que podem criar posts
CREATE INDEX IF NOT EXISTS idx_guide_personas_active_posts ON public.guide_personas(ativo, can_create_posts) WHERE ativo = true AND can_create_posts = true;

-- Comentário explicativo
COMMENT ON COLUMN public.guide_personas.is_roundtable_author IS 'Se true, este bot é o autor principal dos posts de mesa redonda';
COMMENT ON COLUMN public.guide_personas.post_schedule IS 'JSON com horários e dias da semana para posts automáticos';
COMMENT ON COLUMN public.guide_personas.can_create_posts IS 'Se true, este bot pode criar posts próprios (além de comentar)';