CREATE OR REPLACE FUNCTION public.sync_perfil_tags()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_plan_slug text;
  v_now timestamptz := now();
  v_tags text[] := ARRAY[]::text[];
  v_preserved text[] := ARRAY[]::text[];
  v_managed text[] := ARRAY[
    'comunidade',
    'verificado','nao_verificado',
    'trial_ativo','trial_ok',
    'pago_mensal','pago_anual','pago_anualvip','pago_grupovip_lotofacil',
    'gratis',
    'plano_vencido',
    'cancelado_ativo','cancelado_inativo',
    'grupovip_cancelado_ativo','grupovip_cancelado_inativo',
    'trial','expirado','mensal','anual','semestral','anualvip','ativo','email_pendente','email_verificado'
  ];
BEGIN
  IF NEW.is_bot = true THEN
    RETURN NEW;
  END IF;

  IF NEW.tags IS NOT NULL THEN
    SELECT COALESCE(array_agg(t), ARRAY[]::text[])
    INTO v_preserved
    FROM unnest(NEW.tags) t
    WHERE t <> ALL(v_managed);
  END IF;

  v_tags := array_append(v_tags, 'comunidade');

  IF COALESCE(NEW.email_verificado, false) THEN
    v_tags := array_append(v_tags, 'verificado');
  ELSE
    v_tags := array_append(v_tags, 'nao_verificado');
  END IF;

  IF NEW.plan_id IS NOT NULL THEN
    SELECT slug INTO v_plan_slug FROM public.plans WHERE id = NEW.plan_id;
  END IF;

  IF v_plan_slug = 'teste-gratis-3-dias' THEN
    IF NEW.status_assinatura = 'ativa'
       AND NEW.validade_assinatura IS NOT NULL
       AND NEW.validade_assinatura > v_now THEN
      v_tags := array_append(v_tags, 'trial_ativo');
    ELSE
      v_tags := array_append(v_tags, 'trial_ok');
    END IF;

  ELSIF v_plan_slug IN ('mensal','anual','plano-anual-vip') THEN
    IF NEW.status_assinatura = 'ativa'
       AND NEW.validade_assinatura IS NOT NULL
       AND NEW.validade_assinatura > v_now THEN
      IF v_plan_slug = 'mensal' THEN
        v_tags := array_append(v_tags, 'pago_mensal');
      ELSIF v_plan_slug = 'anual' THEN
        v_tags := array_append(v_tags, 'pago_anual');
      ELSIF v_plan_slug = 'plano-anual-vip' THEN
        v_tags := array_append(v_tags, 'pago_anualvip');
      END IF;
    ELSIF NEW.status_assinatura = 'cancelada' THEN
      IF NEW.validade_assinatura IS NOT NULL AND NEW.validade_assinatura > v_now THEN
        v_tags := array_append(v_tags, 'cancelado_ativo');
      ELSE
        v_tags := array_append(v_tags, 'cancelado_inativo');
      END IF;
    ELSE
      v_tags := array_append(v_tags, 'plano_vencido');
    END IF;

  ELSIF v_plan_slug = 'grupo-vip-lotofacil' THEN
    -- Produto WhatsApp puro (sem acesso premium ao app)
    IF NEW.status_assinatura = 'ativa'
       AND NEW.validade_assinatura IS NOT NULL
       AND NEW.validade_assinatura > v_now THEN
      v_tags := array_append(v_tags, 'pago_grupovip_lotofacil');
    ELSIF NEW.status_assinatura = 'cancelada' THEN
      IF NEW.validade_assinatura IS NOT NULL AND NEW.validade_assinatura > v_now THEN
        v_tags := array_append(v_tags, 'grupovip_cancelado_ativo');
      ELSE
        v_tags := array_append(v_tags, 'grupovip_cancelado_inativo');
      END IF;
    ELSE
      v_tags := array_append(v_tags, 'plano_vencido');
    END IF;

  ELSE
    v_tags := array_append(v_tags, 'gratis');
  END IF;

  NEW.tags := ARRAY(SELECT DISTINCT unnest(v_tags || v_preserved));

  RETURN NEW;
END;
$function$;