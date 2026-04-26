-- 1a. Colunas de retry em group_blast_logs
ALTER TABLE public.group_blast_logs
  ADD COLUMN IF NOT EXISTS retry_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error_at timestamptz;

-- 1b. Tabela de auditoria do prepare
CREATE TABLE IF NOT EXISTS public.group_blast_prepare_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at timestamptz NOT NULL DEFAULT now(),
  config_id uuid REFERENCES public.group_blast_configs(id) ON DELETE SET NULL,
  slots_scheduled int NOT NULL DEFAULT 0,
  skipped_dedup int NOT NULL DEFAULT 0,
  error_message text
);

ALTER TABLE public.group_blast_prepare_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins acesso total prepare_runs" ON public.group_blast_prepare_runs;
CREATE POLICY "Admins acesso total prepare_runs"
  ON public.group_blast_prepare_runs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Service role acesso total prepare_runs" ON public.group_blast_prepare_runs;
CREATE POLICY "Service role acesso total prepare_runs"
  ON public.group_blast_prepare_runs FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_group_blast_prepare_runs_ran_at
  ON public.group_blast_prepare_runs (ran_at DESC);