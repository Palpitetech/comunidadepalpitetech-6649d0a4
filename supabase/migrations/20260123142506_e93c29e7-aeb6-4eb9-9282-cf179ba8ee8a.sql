-- Fix: Postgres não suporta CREATE POLICY IF NOT EXISTS. Usamos DO blocks.

-- 1) Tabela de auditoria dos webhooks Kirvano
CREATE TABLE IF NOT EXISTS public.kirvano_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at timestamptz NOT NULL DEFAULT now(),
  event text NULL,
  status text NULL,
  email text NULL,
  phone text NULL,
  checkout_id text NULL,
  sale_id text NULL,
  payment_method text NULL,
  purchase_type text NULL,
  authorized_method text NULL,
  processed boolean NOT NULL DEFAULT false,
  process_result text NULL,
  error text NULL,
  raw_payload jsonb NOT NULL
);

ALTER TABLE public.kirvano_webhook_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'kirvano_webhook_logs'
      AND policyname = 'Service role pode inserir kirvano_webhook_logs'
  ) THEN
    EXECUTE 'CREATE POLICY "Service role pode inserir kirvano_webhook_logs" ON public.kirvano_webhook_logs FOR INSERT WITH CHECK (auth.role() = ''service_role'')';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'kirvano_webhook_logs'
      AND policyname = 'Service role pode atualizar kirvano_webhook_logs'
  ) THEN
    EXECUTE 'CREATE POLICY "Service role pode atualizar kirvano_webhook_logs" ON public.kirvano_webhook_logs FOR UPDATE USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'kirvano_webhook_logs'
      AND policyname = 'Admins podem ler kirvano_webhook_logs'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins podem ler kirvano_webhook_logs" ON public.kirvano_webhook_logs FOR SELECT USING (has_role(auth.uid(), ''admin''::public.app_role))';
  END IF;
END $$;

-- 2) Mapeamento Kirvano Offer -> Plano + validade (dias)
CREATE TABLE IF NOT EXISTS public.kirvano_offer_plan_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id text NOT NULL UNIQUE,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  days_valid integer NOT NULL DEFAULT 30,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kirvano_offer_plan_map ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS kirvano_offer_plan_map_set_updated_at ON public.kirvano_offer_plan_map;
CREATE TRIGGER kirvano_offer_plan_map_set_updated_at
BEFORE UPDATE ON public.kirvano_offer_plan_map
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'kirvano_offer_plan_map'
      AND policyname = 'Admins podem gerenciar kirvano_offer_plan_map'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins podem gerenciar kirvano_offer_plan_map" ON public.kirvano_offer_plan_map FOR ALL USING (has_role(auth.uid(), ''admin''::public.app_role)) WITH CHECK (has_role(auth.uid(), ''admin''::public.app_role))';
  END IF;
END $$;
