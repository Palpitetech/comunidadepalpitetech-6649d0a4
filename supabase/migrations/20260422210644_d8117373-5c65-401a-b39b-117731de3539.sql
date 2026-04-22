
-- Tabela para registrar cada execução do retargeting com métricas
CREATE TABLE IF NOT EXISTS public.lead_retargeting_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at timestamptz NOT NULL DEFAULT now(),
  processed_templates integer NOT NULL DEFAULT 0,
  enqueued integer NOT NULL DEFAULT 0,
  skipped integer NOT NULL DEFAULT 0,
  skipped_dedupe integer NOT NULL DEFAULT 0,
  skipped_converted integer NOT NULL DEFAULT 0,
  skipped_paid_profile integer NOT NULL DEFAULT 0,
  skipped_no_phone integer NOT NULL DEFAULT 0,
  blocked_by_db_constraint integer NOT NULL DEFAULT 0,
  errors_dedupe_db integer NOT NULL DEFAULT 0,
  errors_sales_db integer NOT NULL DEFAULT 0,
  errors_insert_db integer NOT NULL DEFAULT 0,
  errors jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_lead_retargeting_runs_ran_at
  ON public.lead_retargeting_runs (ran_at DESC);

ALTER TABLE public.lead_retargeting_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ler lead_retargeting_runs"
  ON public.lead_retargeting_runs
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role insere lead_retargeting_runs"
  ON public.lead_retargeting_runs
  FOR INSERT
  TO public
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE public.lead_retargeting_runs IS
  'Registra cada execução do edge function process-lead-retargeting com métricas para acompanhamento diário.';
