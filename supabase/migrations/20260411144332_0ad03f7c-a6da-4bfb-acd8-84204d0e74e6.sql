-- Adicionar colunas estatísticas extras à tabela resultados
ALTER TABLE public.resultados 
ADD COLUMN IF NOT EXISTS qtd_fibonacci integer,
ADD COLUMN IF NOT EXISTS soma integer,
ADD COLUMN IF NOT EXISTS sequencias integer;