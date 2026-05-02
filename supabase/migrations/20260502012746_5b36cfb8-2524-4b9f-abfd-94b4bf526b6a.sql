-- Adicionar coluna type à tabela message_templates
ALTER TABLE public.message_templates 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'single' CHECK (type IN ('single', 'sequence', 'random'));

-- Comentário para documentação
COMMENT ON COLUMN public.message_templates.type IS 'Modo do template: single (única), sequence (sequência), random (randomizador)';