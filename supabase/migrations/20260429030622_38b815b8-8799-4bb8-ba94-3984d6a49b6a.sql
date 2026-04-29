ALTER TABLE public.group_blast_logs
  ADD COLUMN IF NOT EXISTS message_source text;

ALTER TABLE public.group_blast_prepare_runs
  ADD COLUMN IF NOT EXISTS slots_resolved integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slots_failed_resolution integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_group_blast_logs_pending_scheduled
  ON public.group_blast_logs (scheduled_for)
  WHERE status = 'pending';