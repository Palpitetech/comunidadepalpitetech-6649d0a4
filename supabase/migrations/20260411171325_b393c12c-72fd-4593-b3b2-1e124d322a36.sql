-- Update the security function to allow bypass via session variable
CREATE OR REPLACE FUNCTION public.prevent_user_subscription_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow bypass via session variable
  IF current_setting('app.bypass_subscription_checks', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Allow service_role via JWT claim
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Allow service_role via auth.role() (edge functions using service_role key)
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Block manipulation of system-managed fields
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

  IF NEW.email_verificado IS DISTINCT FROM OLD.email_verificado THEN
    RAISE EXCEPTION 'Não é permitido alterar o status de verificação de email';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
