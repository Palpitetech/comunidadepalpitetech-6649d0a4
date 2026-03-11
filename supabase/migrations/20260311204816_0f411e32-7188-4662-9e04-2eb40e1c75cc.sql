
-- Create warming_scheduled_messages table
CREATE TABLE public.warming_scheduled_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_instance_id uuid NOT NULL REFERENCES public.whatsapp_instances(id),
  to_instance_id uuid NOT NULL REFERENCES public.whatsapp_instances(id),
  from_evolution_id text NOT NULL,
  to_phone_number text NOT NULL,
  message_content text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  window_name text,
  pair_session_id uuid NOT NULL,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_warming_scheduled_status_time ON public.warming_scheduled_messages (status, scheduled_for);
CREATE INDEX idx_warming_scheduled_session ON public.warming_scheduled_messages (pair_session_id);

-- RLS
ALTER TABLE public.warming_scheduled_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role acesso warming_scheduled_messages"
  ON public.warming_scheduled_messages
  FOR ALL
  TO public
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

CREATE POLICY "Admins podem gerenciar warming_scheduled_messages"
  ON public.warming_scheduled_messages
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
