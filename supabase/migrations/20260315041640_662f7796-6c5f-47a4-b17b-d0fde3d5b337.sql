ALTER TABLE resultados_quina ADD COLUMN IF NOT EXISTS premiacao_json jsonb DEFAULT '[]';
ALTER TABLE resultados_lotomania ADD COLUMN IF NOT EXISTS premiacao_json jsonb DEFAULT '[]';
ALTER TABLE resultados_diadesorte ADD COLUMN IF NOT EXISTS premiacao_json jsonb DEFAULT '[]';