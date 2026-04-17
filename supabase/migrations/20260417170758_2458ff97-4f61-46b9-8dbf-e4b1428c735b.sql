-- Update existing values
UPDATE public.help_content SET intent = 'informational' WHERE intent = 'definicao';
UPDATE public.help_content SET intent = 'analytical' WHERE intent = 'analise';
UPDATE public.help_content SET intent = 'commercial' WHERE intent = 'comparacao';

-- Update default value
ALTER TABLE public.help_content ALTER COLUMN intent SET DEFAULT 'informational';

-- Update documentation
COMMENT ON COLUMN public.help_content.intent IS 'Define a intenção do conteúdo: informational (o que é), analytical (análise), commercial (confiabilidade), data (resultados)';