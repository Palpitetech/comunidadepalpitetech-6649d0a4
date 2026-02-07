-- 1. Renomear is_free_tips_author para is_sales_author
ALTER TABLE public.guide_personas 
RENAME COLUMN is_free_tips_author TO is_sales_author;

-- 2. Adicionar comentário para documentação
COMMENT ON COLUMN public.guide_personas.is_sales_author IS 'Autor de Vendas - publica conteúdo promocional após o resultado';

-- 3. Criar novo campo para Autor de Vendas do Sistema (publica às 18h independente)
ALTER TABLE public.guide_personas 
ADD COLUMN is_system_sales_author boolean NOT NULL DEFAULT false;

-- 4. Adicionar comentário para documentação
COMMENT ON COLUMN public.guide_personas.is_system_sales_author IS 'Autor de Vendas do Sistema - publica às 18h independente do resultado';