-- Tabela isolada para o funil de cadastro (5 etapas) — NÃO referencia auth.users
CREATE TABLE public.cadastros_pendentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  email_verificado boolean NOT NULL DEFAULT false,
  email_codigo varchar(6),
  email_codigo_expira_em timestamptz,
  email_tentativas integer NOT NULL DEFAULT 0,
  email_codigo_enviado_em timestamptz,

  celular text, -- normalizado E.164 (55 + DDD + número)
  celular_verificado boolean NOT NULL DEFAULT false,
  celular_codigo varchar(6),
  celular_codigo_expira_em timestamptz,
  celular_tentativas integer NOT NULL DEFAULT 0,
  celular_codigo_enviado_em timestamptz,

  ip text,
  user_agent text,
  attribution jsonb NOT NULL DEFAULT '{}'::jsonb,
  referral_code text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  finalizado boolean NOT NULL DEFAULT false,
  finalizado_em timestamptz,
  user_id uuid -- preenchido após finalização (auth.users.id)
);

CREATE INDEX idx_cadastros_pendentes_email ON public.cadastros_pendentes(email);
CREATE INDEX idx_cadastros_pendentes_expires ON public.cadastros_pendentes(expires_at) WHERE finalizado = false;

ALTER TABLE public.cadastros_pendentes ENABLE ROW LEVEL SECURITY;

-- Apenas service role (edge functions) acessa
CREATE POLICY "Service role gerencia cadastros_pendentes"
ON public.cadastros_pendentes
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Admins podem auditar
CREATE POLICY "Admins leem cadastros_pendentes"
ON public.cadastros_pendentes
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger updated_at
CREATE TRIGGER trg_cadastros_pendentes_updated_at
BEFORE UPDATE ON public.cadastros_pendentes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();