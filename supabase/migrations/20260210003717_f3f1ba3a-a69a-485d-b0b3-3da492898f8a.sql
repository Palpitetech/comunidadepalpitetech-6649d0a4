
-- Drop the existing permissive update policy
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.perfis;

-- Recreate with column-level restriction via a trigger
-- First, create a trigger function that prevents users from changing subscription fields
CREATE OR REPLACE FUNCTION public.prevent_user_subscription_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow service_role and admins to change anything
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- For regular users, prevent changes to subscription-related fields
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

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS prevent_subscription_changes ON public.perfis;
CREATE TRIGGER prevent_subscription_changes
  BEFORE UPDATE ON public.perfis
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_user_subscription_changes();

-- Recreate the update policy (same as before, trigger handles field restrictions)
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.perfis
  FOR UPDATE
  USING (auth.uid() = id);
