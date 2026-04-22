-- Atualiza trigger_queue_event_templates para incluir as variáveis valor, link_novo_pix e pix_codigo
CREATE OR REPLACE FUNCTION public.trigger_queue_event_templates()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_perfil record;
  v_plan_name text;
  v_plan_slug text;
  v_vip_link text;
  v_priority integer;
  v_variables jsonb;
  v_total_price numeric;
  v_valor_fmt text;
  v_meta_plan_slug text;
  v_link_novo_pix text;
  v_pix_codigo text;
BEGIN
  -- Lookup user profile
  SELECT id, celular, nome, email, plan_id
  INTO v_perfil
  FROM public.perfis
  WHERE id = NEW.user_id;

  IF NOT FOUND OR v_perfil.celular IS NULL OR v_perfil.celular = '' THEN
    RETURN NEW;
  END IF;

  -- Lookup plan name (produto) e slug (para link_novo_pix)
  IF v_perfil.plan_id IS NOT NULL THEN
    SELECT name, slug INTO v_plan_name, v_plan_slug
    FROM public.plans WHERE id = v_perfil.plan_id;
  END IF;

  -- Se o evento traz plan_slug no metadata (ex.: pix_gerado), prioriza esse
  v_meta_plan_slug := NULLIF(NEW.metadata->>'plan_slug', '');
  IF v_meta_plan_slug IS NOT NULL THEN
    v_plan_slug := v_meta_plan_slug;
  END IF;

  -- Lookup link do grupo VIP (primeiro config ativo com link)
  SELECT vip_group_link INTO v_vip_link
  FROM public.group_blast_configs
  WHERE is_active = true AND vip_group_link IS NOT NULL AND vip_group_link <> ''
  ORDER BY created_at ASC
  LIMIT 1;

  -- Formata valor (R$ 27,90) a partir de metadata.total_price
  v_total_price := NULLIF(NEW.metadata->>'total_price', '')::numeric;
  IF v_total_price IS NOT NULL THEN
    v_valor_fmt := 'R$ ' || replace(to_char(v_total_price, 'FM999G990D00'), '.', ',');
    -- to_char com 'FM' já remove zeros à esquerda; ajustar separador de milhar
    v_valor_fmt := regexp_replace(v_valor_fmt, '(\d)(\d{3})(?=,)', '\1.\2');
  ELSE
    v_valor_fmt := '';
  END IF;

  -- Monta link mascarado para gerar novo PIX
  IF v_plan_slug IS NOT NULL AND v_plan_slug <> '' THEN
    v_link_novo_pix := 'https://www.palpitetech.com.br/gerar-novo-pix/' || v_plan_slug;
  ELSE
    v_link_novo_pix := 'https://www.palpitetech.com.br/planos';
  END IF;

  -- Código PIX vem do metadata
  v_pix_codigo := COALESCE(NEW.metadata->>'pix_codigo', '');

  -- Map prioridades — vocabulário canônico + fallback legado
  v_priority := CASE NEW.event_type
    WHEN 'novo_cadastro' THEN 10
    WHEN 'sale_confirmed' THEN 10
    WHEN 'compra_aprovada' THEN 10
    WHEN 'pix_gerado' THEN 9
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
    'link_grupo_vip', COALESCE(v_vip_link, ''),
    'valor', v_valor_fmt,
    'link_novo_pix', v_link_novo_pix,
    'pix_codigo', v_pix_codigo
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