
-- Table: group_blast_configs
CREATE TABLE public.group_blast_configs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  group_jid       text NOT NULL,
  message_content text NOT NULL,
  schedule_times  time[] NOT NULL DEFAULT '{}',
  last_scheduled_index int DEFAULT 0,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.group_blast_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role acesso total group_blast_configs"
  ON public.group_blast_configs FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins acesso total group_blast_configs"
  ON public.group_blast_configs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Table: group_blast_logs
CREATE TABLE public.group_blast_logs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id             uuid REFERENCES public.group_blast_configs(id) ON DELETE CASCADE,
  instance_id           uuid REFERENCES public.whatsapp_instances(id),
  evolution_instance_id text,
  group_jid             text NOT NULL,
  message_content       text NOT NULL,
  status                text DEFAULT 'pending',
  scheduled_for         timestamptz NOT NULL,
  sent_at               timestamptz,
  error_message         text,
  created_at            timestamptz DEFAULT now()
);

CREATE INDEX idx_group_blast_logs_status_scheduled ON public.group_blast_logs(status, scheduled_for);
CREATE INDEX idx_group_blast_logs_config_created ON public.group_blast_logs(config_id, created_at DESC);

ALTER TABLE public.group_blast_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role acesso total group_blast_logs"
  ON public.group_blast_logs FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins acesso total group_blast_logs"
  ON public.group_blast_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
