-- Adicionar coluna para estratégia completa (JSON)
ALTER TABLE public.palpites_salvos 
ADD COLUMN IF NOT EXISTS estrategia_data JSONB DEFAULT NULL;