
-- ============================================================
-- 1) Função: queue_email_templates_for_event
-- Espelha queue_templates_for_event mas para email_queue
-- ============================================================
CREATE OR REPLACE FUNCTION public.queue_email_templates_for_event(
  p_event_trigger text,
  p_email text,
  p_name text,
  p_user_id uuid,
  p_variables jsonb DEFAULT '{}'::jsonb,
  p_priority integer DEFAULT 5
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_template record;
  v_scheduled_at timestamptz;
  v_count integer := 0;
  v_email_norm text;
  v_user_tags text[];
  v_user_plan_id uuid;
  v_match_ok boolean;
BEGIN
  IF p_email IS NULL OR p_email = '' THEN
    RETURN 0;
  END IF;

  v_email_norm := lower(trim(p_email));

  -- bloqueio por supressão (bounce/complaint/unsubscribe)
  IF EXISTS (SELECT 1 FROM public.email_suppressions WHERE email = v_email_norm) THEN
    RETURN 0;
  END IF;

  -- contexto do usuário para filtros de plano/tag
  IF p_user_id IS NOT NULL THEN
    SELECT plan_id, COALESCE(tags, '{}'::text[])
      INTO v_user_plan_id, v_user_tags
    FROM public.perfis WHERE id = p_user_id;
  END IF;
  v_user_tags := COALESCE(v_user_tags, '{}'::text[]);

  FOR v_template IN
    SELECT id, delay_minutes, plan_ids, include_tags, exclude_tags, tags_match_mode
    FROM public.email_templates
    WHERE event_trigger = p_event_trigger
      AND is_active = true
  LOOP
    -- filtro de plano
    IF v_template.plan_ids IS NOT NULL AND array_length(v_template.plan_ids, 1) > 0 THEN
      IF v_user_plan_id IS NULL OR NOT (v_user_plan_id = ANY (v_template.plan_ids)) THEN
        CONTINUE;
      END IF;
    END IF;

    -- exclude_tags: se qualquer tag do usuário estiver na lista, pula
    IF v_template.exclude_tags IS NOT NULL AND array_length(v_template.exclude_tags, 1) > 0 THEN
      IF v_user_tags && v_template.exclude_tags THEN
        CONTINUE;
      END IF;
    END IF;

    -- include_tags
    IF v_template.include_tags IS NOT NULL AND array_length(v_template.include_tags, 1) > 0 THEN
      IF v_template.tags_match_mode = 'all' THEN
        v_match_ok := v_template.include_tags <@ v_user_tags;
      ELSE
        v_match_ok := v_user_tags && v_template.include_tags;
      END IF;
      IF NOT v_match_ok THEN
        CONTINUE;
      END IF;
    END IF;

    v_scheduled_at := now() + COALESCE(v_template.delay_minutes, 0) * interval '1 minute';

    BEGIN
      INSERT INTO public.email_queue (
        template_id, recipient_email, recipient_name,
        variables, status, scheduled_at, priority
      ) VALUES (
        v_template.id, v_email_norm, p_name,
        COALESCE(p_variables, '{}'::jsonb), 'pending', v_scheduled_at, p_priority
      );
      v_count := v_count + 1;
    EXCEPTION
      WHEN unique_violation THEN
        -- dedupe da janela 7 dias: ignora silenciosamente
        NULL;
      WHEN exclusion_violation THEN
        NULL;
      WHEN OTHERS THEN
        RAISE WARNING 'Erro inserindo email_queue: %', SQLERRM;
    END;
  END LOOP;

  RETURN v_count;
END;
$function$;

-- ============================================================
-- 2) Atualizar trigger_queue_event_templates para chamar email
-- Mantém todo o comportamento WhatsApp existente
-- ============================================================
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
  v_link_sala_secreta_mega text := 'https://www.palpitetech.com.br/g/ms-sala-secreta?utm_source=email&utm_medium=lead_retarget&utm_campaign=maratona_mega_30anos';
  v_link_sala_vip_mega text := 'https://www.palpitetech.com.br/g/ms-sala-vip?utm_source=email&utm_medium=sale_confirmed&utm_campaign=aula_mega_especial_vip';
BEGIN
  SELECT id, celular, nome, email, plan_id
  INTO v_perfil
  FROM public.perfis
  WHERE id = NEW.user_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF v_perfil.plan_id IS NOT NULL THEN
    SELECT name, slug INTO v_plan_name, v_plan_slug
    FROM public.plans WHERE id = v_perfil.plan_id;
  END IF;

  v_meta_plan_slug := NULLIF(NEW.metadata->>'plan_slug', '');
  IF v_meta_plan_slug IS NOT NULL THEN
    v_plan_slug := v_meta_plan_slug;
  END IF;

  SELECT vip_group_link INTO v_vip_link
  FROM public.group_blast_configs
  WHERE is_active = true AND vip_group_link IS NOT NULL AND vip_group_link <> ''
  ORDER BY created_at ASC
  LIMIT 1;

  v_total_price := NULLIF(NEW.metadata->>'total_price', '')::numeric;
  IF v_total_price IS NOT NULL THEN
    v_valor_fmt := 'R$ ' || replace(to_char(v_total_price, 'FM999G990D00'), '.', ',');
    v_valor_fmt := regexp_replace(v_valor_fmt, '(\d)(\d{3})(?=,)', '\1.\2');
  ELSE
    v_valor_fmt := '';
  END IF;

  IF v_plan_slug IS NOT NULL AND v_plan_slug <> '' THEN
    v_link_novo_pix := 'https://www.palpitetech.com.br/gerar-novo-pix/' || v_plan_slug;
  ELSE
    v_link_novo_pix := 'https://www.palpitetech.com.br/planos';
  END IF;

  v_pix_codigo := COALESCE(NEW.metadata->>'pix_codigo', '');

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

  v_variables := COALESCE(NEW.metadata, '{}'::jsonb) || jsonb_build_object(
    'nome', COALESCE(v_perfil.nome, ''),
    'telefone', COALESCE(v_perfil.celular, ''),
    'email', COALESCE(v_perfil.email, ''),
    'produto', COALESCE(v_plan_name, ''),
    'plano_nome', COALESCE(v_plan_name, ''),
    'link_grupo_vip', COALESCE(v_vip_link, ''),
    'valor', v_valor_fmt,
    'link_novo_pix', v_link_novo_pix,
    'pix_codigo', v_pix_codigo,
    'link_sala_secreta_mega', v_link_sala_secreta_mega,
    'link_sala_vip_mega', v_link_sala_vip_mega
  );

  -- WhatsApp (mantém comportamento original)
  IF v_perfil.celular IS NOT NULL AND v_perfil.celular <> '' THEN
    PERFORM public.queue_templates_for_event(
      NEW.event_type,
      v_perfil.celular,
      v_perfil.nome,
      v_perfil.id,
      v_variables,
      v_priority
    );
  END IF;

  -- Email (novo)
  IF v_perfil.email IS NOT NULL AND v_perfil.email <> '' THEN
    PERFORM public.queue_email_templates_for_event(
      NEW.event_type,
      v_perfil.email,
      v_perfil.nome,
      v_perfil.id,
      v_variables,
      v_priority
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro em trigger_queue_event_templates: %', SQLERRM;
    RETURN NEW;
END;
$function$;
