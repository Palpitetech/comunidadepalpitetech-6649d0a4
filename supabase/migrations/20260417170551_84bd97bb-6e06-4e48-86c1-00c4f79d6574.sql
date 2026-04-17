ALTER TABLE public.help_content 
ADD COLUMN intent TEXT DEFAULT 'definicao';

-- Comentário para documentação
COMMENT ON COLUMN public.help_content.intent IS 'Define a intenção do conteúdo para variar a estrutura da página (ex: definicao, analise, comparacao)';