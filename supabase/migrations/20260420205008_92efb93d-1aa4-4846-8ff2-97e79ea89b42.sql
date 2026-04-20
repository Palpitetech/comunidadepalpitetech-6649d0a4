CREATE OR REPLACE FUNCTION public.ativar_trial_pos_confirmacao()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  trial_plan_id UUID := 'b3a2a9e3-8e3b-4e3b-8e3b-8e3b8e3b8e3b';
BEGIN
  -- Só age na transição false → true
  IF (OLD.email_verificado IS DISTINCT FROM TRUE) AND NEW.email_verificado IS TRUE THEN
    -- Limpa tag pendente, garante verificado
    NEW.tags := array_remove(COALESCE(NEW.tags, ARRAY[]::text[]), 'email_pendente');
    IF NOT ('email_verificado' = ANY(NEW.tags)) THEN
      NEW.tags := array_append(NEW.tags, 'email_verificado');
    END IF;

    -- Ativa trial só se ainda não tiver assinatura ativa
    IF NEW.status_assinatura IS NULL OR NEW.status_assinatura <> 'ativa' THEN
      NEW.plan_id := trial_plan_id;
      NEW.status_assinatura := 'ativa';
      NEW.validade_assinatura := now() + interval '3 days';
      NEW.trial_used := true;

      -- Concede role premium para acesso ao trial
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'premium')
      ON CONFLICT (user_id, role) DO NOTHING;

      -- Garante role base 'user' também
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'user')
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;

    -- Loga evento de confirmação
    INSERT INTO public.events (user_id, event_type, metadata)
    VALUES (
      NEW.id,
      'lead_email_confirmado',
      jsonb_build_object(
        'email', NEW.email,
        'trial_ativado', (NEW.status_assinatura = 'ativa')
      )
    );
  END IF;

  RETURN NEW;
END;
$function$;