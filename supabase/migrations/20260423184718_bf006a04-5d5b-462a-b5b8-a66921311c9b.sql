-- Campos novos em postagens p/ pré-geração + gerador baseado em estudo
ALTER TABLE public.postagens
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'publicado',
  ADD COLUMN IF NOT EXISTS publicar_em timestamptz,
  ADD COLUMN IF NOT EXISTS fatos_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS tema_estudo text;

-- Backfill tema_estudo a partir de tipo (idempotente)
UPDATE public.postagens
SET tema_estudo = tipo
WHERE tema_estudo IS NULL AND tipo IS NOT NULL;

-- Constraint de status (drop se existir p/ idempotência)
DO $$ BEGIN
  ALTER TABLE public.postagens
    ADD CONSTRAINT postagens_status_check
    CHECK (status IN ('rascunho', 'publicado'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Índice parcial: cron horário busca rascunhos prontos
CREATE INDEX IF NOT EXISTS idx_postagens_rascunhos_prontos
  ON public.postagens (publicar_em)
  WHERE status = 'rascunho';

-- Índice p/ feed Estudos filtrar por status rapidamente
CREATE INDEX IF NOT EXISTS idx_postagens_status_created
  ON public.postagens (status, created_at DESC);

-- Índice p/ lookup do gerador baseado em estudo (loteria_tag + tema_estudo + status)
CREATE INDEX IF NOT EXISTS idx_postagens_estudo_lookup
  ON public.postagens (loteria_tag, tema_estudo, status);