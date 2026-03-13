-- Remover política que permite qualquer autenticado inserir audit logs
-- Manter apenas a política de service_role para inserção
DROP POLICY IF EXISTS "Authenticated users podem inserir audit logs" ON public.admin_audit_logs;

-- Criar política restrita: apenas admins podem inserir seus próprios audit logs
CREATE POLICY "Admins podem inserir audit logs"
  ON public.admin_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = admin_id AND has_role(auth.uid(), 'admin'::app_role));