-- Adicionar colunas de indicadores faltantes na tabela resultados_loterias
ALTER TABLE public.resultados_loterias
  ADD COLUMN IF NOT EXISTS soma integer,
  ADD COLUMN IF NOT EXISTS sequencias integer,
  ADD COLUMN IF NOT EXISTS qtd_fibonacci integer,
  ADD COLUMN IF NOT EXISTS soma_s2 integer,
  ADD COLUMN IF NOT EXISTS sequencias_s2 integer,
  ADD COLUMN IF NOT EXISTS qtd_fibonacci_s2 integer;