-- 1) handle_new_user: criar perfil PENDENTE, sem trial automático, sem role premium
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Cria perfil pendente: sem plano, sem trial, sem assinatura ativa
  INSERT INTO public.perfis (
    id,
    nome,
    email,
    tags,
    plan_id,
    status_assinatura,
    validade_assinatura,
    trial_used,
    email_verificado
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    ARRAY['comunidade', 'email_pendente'],
    NULL,
    'pendente',
    NULL,
    false,
    false
  );

  -- Apenas role base 'user'. Premium só vem após pagamento ou ativação manual de trial.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Log de cadastro (sem trial)
  INSERT INTO public.events (user_id, event_type, metadata)
  VALUES (
    NEW.id,
    'novo_cadastro',
    jsonb_build_object(
      'email', NEW.email,
      'nome', COALESCE(NEW.raw_user_meta_data->>'nome', NULL),
      'origem', COALESCE(NEW.raw_user_meta_data->>'origem', 'comunidade'),
      'trial_activated', false
    )
  );

  RETURN NEW;
END;
$function$;

-- 2) ativar_trial_pos_confirmacao: NÃO ativar trial automaticamente.
-- Apenas marca tags e loga o evento de confirmação. Trial é ativado pelo usuário via UpgradeModal.
CREATE OR REPLACE FUNCTION public.ativar_trial_pos_confirmacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Só age na transição false → true
  IF (OLD.email_verificado IS DISTINCT FROM TRUE) AND NEW.email_verificado IS TRUE THEN
    -- Limpa tag pendente, marca como verificado
    NEW.tags := array_remove(COALESCE(NEW.tags, ARRAY[]::text[]), 'email_pendente');
    IF NOT ('email_verificado' = ANY(NEW.tags)) THEN
      NEW.tags := array_append(NEW.tags, 'email_verificado');
    END IF;

    -- Loga apenas a confirmação. NÃO ativa trial.
    INSERT INTO public.events (user_id, event_type, metadata)
    VALUES (
      NEW.id,
      'lead_email_confirmado',
      jsonb_build_object(
        'email', NEW.email,
        'trial_ativado', false
      )
    );
  END IF;

  RETURN NEW;
END;
$function$;