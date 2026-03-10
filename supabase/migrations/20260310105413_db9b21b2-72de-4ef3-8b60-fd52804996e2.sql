
-- 1. Tabela de auditoria para acesso a dados sensíveis
CREATE TABLE public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index para consultas por admin e data
CREATE INDEX idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

-- RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ler os logs de auditoria
CREATE POLICY "Admins podem ler audit logs"
  ON public.admin_audit_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Usuários autenticados podem inserir (para registrar seu próprio acesso)
CREATE POLICY "Authenticated users podem inserir audit logs"
  ON public.admin_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = admin_id);

-- Service role pode inserir
CREATE POLICY "Service role pode inserir audit logs"
  ON public.admin_audit_logs
  FOR INSERT
  TO public
  WITH CHECK (auth.role() = 'service_role');

-- 2. View mascarada dos webhook logs para acesso seguro
CREATE OR REPLACE VIEW public.kirvano_webhook_logs_masked AS
SELECT
  id,
  received_at,
  event,
  status,
  CASE
    WHEN email IS NOT NULL THEN
      LEFT(email, 2) || '***' || SUBSTRING(email FROM POSITION('@' IN email))
    ELSE NULL
  END AS email_masked,
  CASE
    WHEN phone IS NOT NULL THEN
      LEFT(phone, 3) || '****' || RIGHT(phone, 2)
    ELSE NULL
  END AS phone_masked,
  email,
  phone,
  checkout_id,
  sale_id,
  payment_method,
  purchase_type,
  authorized_method,
  process_result,
  error,
  processed,
  -- Remove campos sensíveis do raw_payload na view
  raw_payload - 'customer' - 'payer' AS raw_payload_safe,
  raw_payload
FROM public.kirvano_webhook_logs;

-- 3. Função para registrar acesso e retornar dados
CREATE OR REPLACE FUNCTION public.audit_webhook_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_audit_logs (admin_id, action, table_name, details)
  VALUES (
    auth.uid(),
    'SELECT',
    'kirvano_webhook_logs',
    jsonb_build_object('timestamp', now()::text)
  );
END;
$$;
