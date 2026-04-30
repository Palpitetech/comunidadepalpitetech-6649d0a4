-- Dropar a função antiga para evitar erros de assinatura ou parâmetros padrão
DROP FUNCTION IF EXISTS public.should_send_template(uuid, uuid, jsonb);

-- Criar a nova versão da função
CREATE OR REPLACE FUNCTION public.should_send_template(p_template_id uuid, p_user_id uuid, p_variables jsonb DEFAULT '{}'::jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
  v_template record;
  v_perfil record;
  v_event_plan_slug text;
  v_event_plan_id uuid;
BEGIN
  SELECT include_tags, exclude_tags, plan_ids, tags_match_mode, category
  INTO v_template
  FROM public.message_templates
  WHERE id = p_template_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- REGRA DE OURO: Se for transacional, envia pelo evento SEM FILTRAR POR TAGS
  IF v_template.category = 'transactional' THEN
    IF array_length(v_template.plan_ids, 1) IS NULL THEN
      RETURN true;
    END IF;
  END IF;

  SELECT tags, plan_id INTO v_perfil
  FROM public.perfis
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    IF v_template.category = 'marketing' THEN
      RETURN false;
    END IF;
    v_perfil.tags := ARRAY[]::text[];
    v_perfil.plan_id := NULL;
  END IF;

  -- Filtros de TAGS (Apenas para marketing)
  IF v_template.category = 'marketing' THEN
    IF array_length(v_template.include_tags, 1) IS NOT NULL THEN
      IF v_template.tags_match_mode = 'all' THEN
        IF NOT (COALESCE(v_perfil.tags, ARRAY[]::text[]) @> v_template.include_tags) THEN
          RETURN false;
        END IF;
      ELSE
        IF NOT (COALESCE(v_perfil.tags, ARRAY[]::text[]) && v_template.include_tags) THEN
          RETURN false;
        END IF;
      END IF;
    END IF;

    IF array_length(v_template.exclude_tags, 1) IS NOT NULL THEN
      IF COALESCE(v_perfil.tags, ARRAY[]::text[]) && v_template.exclude_tags THEN
        RETURN false;
      END IF;
    END IF;
  END IF;

  -- Filtro de Planos (Aplica a ambos)
  IF array_length(v_template.plan_ids, 1) IS NOT NULL THEN
    IF v_perfil.plan_id IS NOT NULL AND v_perfil.plan_id = ANY(v_template.plan_ids) THEN
      RETURN true;
    END IF;

    v_event_plan_slug := NULLIF(p_variables->>'plan_slug', '');
    IF v_event_plan_slug IS NOT NULL THEN
      SELECT id INTO v_event_plan_id
      FROM public.plans
      WHERE slug = v_event_plan_slug
      LIMIT 1;

      IF v_event_plan_id IS NOT NULL AND v_event_plan_id = ANY(v_template.plan_ids) THEN
        RETURN true;
      END IF;
    END IF;

    RETURN false;
  END IF;

  RETURN true;
END;
$function$;
