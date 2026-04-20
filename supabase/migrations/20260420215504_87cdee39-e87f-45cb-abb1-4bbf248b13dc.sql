-- Atualizar trigger para incluir produto, plano_nome, link_grupo_vip e alinhar prioridades com vocabulário canônico
CREATE OR REPLACE FUNCTION public.trigger_queue_event_templates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_perfil record;
  v_plan_name text;
  v_vip_link text;
  v_priority integer;
  v_variables jsonb;
BEGIN
  -- Lookup user profile
  SELECT id, celular, nome, email, plan_id
  INTO v_perfil
  FROM public.perfis
  WHERE id = NEW.user_id;

  IF NOT FOUND OR v_perfil.celular IS NULL OR v_perfil.celular = '' THEN
    RETURN NEW;
  END IF;

  -- Lookup plan name (produto)
  IF v_perfil.plan_id IS NOT NULL THEN
    SELECT name INTO v_plan_name FROM public.plans WHERE id = v_perfil.plan_id;
  END IF;

  -- Lookup link do grupo VIP (primeiro config ativo com link)
  SELECT vip_group_link INTO v_vip_link
  FROM public.group_blast_configs
  WHERE is_active = true AND vip_group_link IS NOT NULL AND vip_group_link <> ''
  ORDER BY created_at ASC
  LIMIT 1;

  -- Map prioridades — vocabulário canônico + fallback legado
  v_priority := CASE NEW.event_type
    WHEN 'novo_cadastro' THEN 10
    WHEN 'sale_confirmed' THEN 10
    WHEN 'compra_aprovada' THEN 10
    WHEN 'trial_iniciado' THEN 9
    WHEN 'assinatura_expirada' THEN 8
    WHEN 'subscription_expired' THEN 8
    WHEN 'acesso_cortado' THEN 8
    WHEN 'carrinho_abandonado' THEN 5
    ELSE 5
  END;

  -- Build variables
  v_variables := COALESCE(NEW.metadata, '{}'::jsonb) || jsonb_build_object(
    'nome', COALESCE(v_perfil.nome, ''),
    'telefone', COALESCE(v_perfil.celular, ''),
    'email', COALESCE(v_perfil.email, ''),
    'produto', COALESCE(v_plan_name, ''),
    'plano_nome', COALESCE(v_plan_name, ''),
    'link_grupo_vip', COALESCE(v_vip_link, '')
  );

  PERFORM public.queue_templates_for_event(
    NEW.event_type,
    v_perfil.celular,
    v_perfil.nome,
    v_perfil.id,
    v_variables,
    v_priority
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro em trigger_queue_event_templates: %', SQLERRM;
    RETURN NEW;
END;
$function$;