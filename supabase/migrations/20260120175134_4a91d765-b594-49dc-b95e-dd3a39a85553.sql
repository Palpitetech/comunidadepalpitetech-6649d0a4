-- Adicionar coluna para rastrear dezenas faltantes do ciclo
ALTER TABLE public.resultados 
ADD COLUMN IF NOT EXISTS dezenas_faltantes_ciclo integer[];

-- Adicionar coluna metadata para postagens de bots
ALTER TABLE public.postagens 
ADD COLUMN IF NOT EXISTS metadata jsonb;