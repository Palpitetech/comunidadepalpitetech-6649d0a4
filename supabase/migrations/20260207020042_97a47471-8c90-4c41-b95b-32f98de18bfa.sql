-- Adicionar colunas para segmentar as orientações do prompt
ALTER TABLE public.guide_personas 
ADD COLUMN IF NOT EXISTS prompt_objetivo TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS prompt_estrutura_post TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS prompt_modelos_mensagem TEXT DEFAULT '';

-- Adicionar comentários descritivos
COMMENT ON COLUMN public.guide_personas.prompt_objetivo IS 'Principal objetivo e missão do bot';
COMMENT ON COLUMN public.guide_personas.prompt_estrutura_post IS 'Estrutura e formato das postagens';
COMMENT ON COLUMN public.guide_personas.prompt_modelos_mensagem IS 'Modelos e exemplos de mensagens';