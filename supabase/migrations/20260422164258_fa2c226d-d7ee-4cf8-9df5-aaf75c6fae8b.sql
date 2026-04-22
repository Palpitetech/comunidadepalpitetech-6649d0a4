-- Criar tabela leads_inbox para contatos parciais (sem auth)
CREATE TABLE public.leads_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text,
  email text,
  celular text,
  source text,
  utm_source text,
  pagina_origem text,
  tags text[] DEFAULT ARRAY[]::text[],
  webhook_id uuid REFERENCES public.lead_webhooks(id) ON DELETE SET NULL,
  webhook_name text,
  ip text,
  raw_payload jsonb,
  status text NOT NULL DEFAULT 'novo',
  perfil_id uuid REFERENCES public.perfis(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_leads_inbox_created ON public.leads_inbox(created_at DESC);
CREATE INDEX idx_leads_inbox_email ON public.leads_inbox(lower(email)) WHERE email IS NOT NULL;
CREATE INDEX idx_leads_inbox_celular ON public.leads_inbox(celular) WHERE celular IS NOT NULL;
CREATE INDEX idx_leads_inbox_status ON public.leads_inbox(status);

-- RLS
ALTER TABLE public.leads_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam leads_inbox"
  ON public.leads_inbox FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger updated_at
CREATE TRIGGER update_leads_inbox_updated_at
BEFORE UPDATE ON public.leads_inbox
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();