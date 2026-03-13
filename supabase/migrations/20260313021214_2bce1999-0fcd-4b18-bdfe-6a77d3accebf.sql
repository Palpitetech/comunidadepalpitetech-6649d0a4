
CREATE TABLE public.lead_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  source_tag text NOT NULL,
  is_active boolean DEFAULT true,
  leads_count integer DEFAULT 0,
  last_lead_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.lead_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role acesso total lead_webhooks"
ON public.lead_webhooks
FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins podem gerenciar lead_webhooks"
ON public.lead_webhooks
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
