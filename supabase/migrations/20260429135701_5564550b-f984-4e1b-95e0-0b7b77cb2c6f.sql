
-- ============= EMAIL TEMPLATES =============
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  html text NOT NULL,
  event_trigger text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  delay_minutes integer NOT NULL DEFAULT 0,
  include_tags text[] NOT NULL DEFAULT '{}',
  exclude_tags text[] NOT NULL DEFAULT '{}',
  plan_ids uuid[] NOT NULL DEFAULT '{}',
  tags_match_mode text NOT NULL DEFAULT 'any',
  from_name text NOT NULL DEFAULT 'Palpite Tech',
  reply_to text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam email_templates" ON public.email_templates
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role acesso email_templates" ON public.email_templates
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= EMAIL QUEUE =============
CREATE TABLE public.email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  variables jsonb NOT NULL DEFAULT '{}'::jsonb,
  subject_render text,
  html_render text,
  status text NOT NULL DEFAULT 'pending',
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  resend_message_id text,
  error_message text,
  retry_count integer NOT NULL DEFAULT 0,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_queue_priority_scheduled
  ON public.email_queue (status, priority DESC, scheduled_at)
  WHERE status = 'pending';

CREATE INDEX idx_email_queue_recipient ON public.email_queue (recipient_email);

-- Dedupe in 7-day window: same template + recipient
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE OR REPLACE FUNCTION public._email_queue_dedupe_window(ts timestamptz)
RETURNS tstzrange
LANGUAGE sql IMMUTABLE
AS $$ SELECT tstzrange(ts, ts + interval '7 days', '[)') $$;

ALTER TABLE public.email_queue
  ADD CONSTRAINT email_queue_dedupe_7d_excl
  EXCLUDE USING gist (
    template_id WITH =,
    recipient_email WITH =,
    public._email_queue_dedupe_window(created_at) WITH &&
  )
  WHERE (template_id IS NOT NULL AND recipient_email IS NOT NULL);

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam email_queue" ON public.email_queue
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role acesso email_queue" ON public.email_queue
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============= EMAIL SEND LOGS =============
CREATE TABLE public.email_send_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid REFERENCES public.email_queue(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL,
  status text NOT NULL,
  resend_message_id text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_send_logs_created ON public.email_send_logs (created_at DESC);
CREATE INDEX idx_email_send_logs_recipient ON public.email_send_logs (recipient_email);

ALTER TABLE public.email_send_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins veem email_send_logs" ON public.email_send_logs
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role acesso email_send_logs" ON public.email_send_logs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============= EMAIL SUPPRESSIONS =============
CREATE TABLE public.email_suppressions (
  email text PRIMARY KEY,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam email_suppressions" ON public.email_suppressions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role acesso email_suppressions" ON public.email_suppressions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
