
-- =====================================================
-- FASE 1: Proteção contra escalação de privilégio
-- Bloquear alteração de email_verificado por usuários
-- =====================================================

CREATE OR REPLACE FUNCTION public.prevent_user_subscription_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.plan_id IS DISTINCT FROM OLD.plan_id THEN
    RAISE EXCEPTION 'Não é permitido alterar o plano diretamente';
  END IF;

  IF NEW.status_assinatura IS DISTINCT FROM OLD.status_assinatura THEN
    RAISE EXCEPTION 'Não é permitido alterar o status da assinatura';
  END IF;

  IF NEW.validade_assinatura IS DISTINCT FROM OLD.validade_assinatura THEN
    RAISE EXCEPTION 'Não é permitido alterar a validade da assinatura';
  END IF;

  IF NEW.custom_features IS DISTINCT FROM OLD.custom_features THEN
    RAISE EXCEPTION 'Não é permitido alterar permissões customizadas';
  END IF;

  IF NEW.is_blocked IS DISTINCT FROM OLD.is_blocked THEN
    RAISE EXCEPTION 'Não é permitido alterar o status de bloqueio';
  END IF;

  IF NEW.is_bot IS DISTINCT FROM OLD.is_bot THEN
    RAISE EXCEPTION 'Não é permitido alterar o tipo de conta';
  END IF;

  IF NEW.cpf IS DISTINCT FROM OLD.cpf THEN
    RAISE EXCEPTION 'Não é permitido alterar o CPF diretamente';
  END IF;

  IF NEW.asaas_customer_id IS DISTINCT FROM OLD.asaas_customer_id THEN
    RAISE EXCEPTION 'Não é permitido alterar dados de pagamento';
  END IF;

  IF NEW.asaas_subscription_id IS DISTINCT FROM OLD.asaas_subscription_id THEN
    RAISE EXCEPTION 'Não é permitido alterar dados de pagamento';
  END IF;

  IF NEW.admin_notes IS DISTINCT FROM OLD.admin_notes THEN
    RAISE EXCEPTION 'Não é permitido alterar notas administrativas';
  END IF;

  IF NEW.tags IS DISTINCT FROM OLD.tags THEN
    RAISE EXCEPTION 'Não é permitido alterar tags diretamente';
  END IF;

  IF NEW.referral_code IS DISTINCT FROM OLD.referral_code THEN
    RAISE EXCEPTION 'Não é permitido alterar código de indicação';
  END IF;

  -- NEW: Block email_verificado manipulation
  IF NEW.email_verificado IS DISTINCT FROM OLD.email_verificado THEN
    RAISE EXCEPTION 'Não é permitido alterar o status de verificação de email';
  END IF;

  RETURN NEW;
END;
$function$;

-- =====================================================
-- FASE 2: Tabelas de bolões - Admin only
-- =====================================================

-- boloes
DROP POLICY IF EXISTS "Admins full access boloes" ON public.boloes;
CREATE POLICY "Admins full access boloes" ON public.boloes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- bolao_cotas
DROP POLICY IF EXISTS "Admins full access bolao_cotas" ON public.bolao_cotas;
CREATE POLICY "Admins full access bolao_cotas" ON public.bolao_cotas
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- bolao_resgates
DROP POLICY IF EXISTS "Admins full access bolao_resgates" ON public.bolao_resgates;
CREATE POLICY "Admins full access bolao_resgates" ON public.bolao_resgates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- carteira_movimentacoes
DROP POLICY IF EXISTS "Admins full access carteira" ON public.carteira_movimentacoes;
CREATE POLICY "Admins full access carteira" ON public.carteira_movimentacoes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- FASE 2b: Tabelas administrativas - Admin only
-- =====================================================

-- admin_settings
DROP POLICY IF EXISTS "Admins full access admin_settings" ON public.admin_settings;
CREATE POLICY "Admins full access admin_settings" ON public.admin_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- admin_audit_logs
DROP POLICY IF EXISTS "Admins full access audit_logs" ON public.admin_audit_logs;
CREATE POLICY "Admins full access audit_logs" ON public.admin_audit_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- lead_webhooks
DROP POLICY IF EXISTS "Admins full access lead_webhooks" ON public.lead_webhooks;
CREATE POLICY "Admins full access lead_webhooks" ON public.lead_webhooks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- kirvano_offer_plan_map
DROP POLICY IF EXISTS "Admins full access kirvano_offer_plan_map" ON public.kirvano_offer_plan_map;
CREATE POLICY "Admins full access kirvano_offer_plan_map" ON public.kirvano_offer_plan_map
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- kirvano_webhook_logs
DROP POLICY IF EXISTS "Admins full access kirvano_webhook_logs" ON public.kirvano_webhook_logs;
CREATE POLICY "Admins full access kirvano_webhook_logs" ON public.kirvano_webhook_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- FASE 3: Storage - boloes-pdfs privado
-- =====================================================

UPDATE storage.buckets SET public = false WHERE id = 'boloes-pdfs';

-- Remove any existing public policies
DROP POLICY IF EXISTS "Public read boloes-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view boloes PDFs" ON storage.objects;

-- Admin-only access
DROP POLICY IF EXISTS "Admins full access boloes-pdfs" ON storage.objects;
CREATE POLICY "Admins full access boloes-pdfs" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'boloes-pdfs' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'boloes-pdfs' AND public.has_role(auth.uid(), 'admin'));
