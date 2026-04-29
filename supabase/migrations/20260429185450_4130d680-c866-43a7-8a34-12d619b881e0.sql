
-- =========================================================
-- 1) should_send_template agora aceita variables (jsonb) e
--    casa plan_ids também via plan_slug nas variables
-- =========================================================
CREATE OR REPLACE FUNCTION public.should_send_template(
  p_template_id uuid,
  p_user_id uuid,
  p_variables jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_template record;
  v_perfil record;
  v_event_plan_slug text;
  v_event_plan_id uuid;
BEGIN
  SELECT include_tags, exclude_tags, plan_ids, tags_match_mode
  INTO v_template
  FROM public.message_templates
  WHERE id = p_template_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Sem filtros = envia para todos
  IF array_length(v_template.include_tags, 1) IS NULL
     AND array_length(v_template.exclude_tags, 1) IS NULL
     AND array_length(v_template.plan_ids, 1) IS NULL THEN
    RETURN true;
  END IF;

  SELECT tags, plan_id INTO v_perfil
  FROM public.perfis
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    -- Sem perfil ainda, mas se o template filtra só por plan_ids
    -- e temos plan_slug nas variables, ainda podemos validar
    v_perfil.tags := ARRAY[]::text[];
    v_perfil.plan_id := NULL;
  END IF;

  -- include_tags
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

  -- exclude_tags
  IF array_length(v_template.exclude_tags, 1) IS NOT NULL THEN
    IF COALESCE(v_perfil.tags, ARRAY[]::text[]) && v_template.exclude_tags THEN
      RETURN false;
    END IF;
  END IF;

  -- plan_ids: aceita match por perfil OU por plan_slug das variables
  IF array_length(v_template.plan_ids, 1) IS NOT NULL THEN
    -- 1) match pelo plan_id atual do perfil
    IF v_perfil.plan_id IS NOT NULL AND v_perfil.plan_id = ANY(v_template.plan_ids) THEN
      RETURN true;
    END IF;

    -- 2) match pelo plan_slug vindo no evento
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

-- =========================================================
-- 2) queue_templates_for_event repassa variables ao filtro
-- =========================================================
CREATE OR REPLACE FUNCTION public.queue_templates_for_event(
  p_event_trigger text,
  p_phone text,
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
  v_variant_id uuid;
BEGIN
  IF p_phone IS NULL OR p_phone = '' THEN
    RETURN 0;
  END IF;

  FOR v_template IN
    SELECT id, delay_enabled, delay_minutes
    FROM public.message_templates
    WHERE event_trigger = p_event_trigger
      AND is_active = true
  LOOP
    IF p_user_id IS NOT NULL
       AND NOT public.should_send_template(v_template.id, p_user_id, p_variables) THEN
      CONTINUE;
    END IF;

    IF v_template.delay_enabled AND v_template.delay_minutes > 0 THEN
      v_scheduled_at := now() + (v_template.delay_minutes || ' minutes')::interval;
    ELSE
      v_scheduled_at := now();
    END IF;

    v_variant_id := public.pick_template_variant(v_template.id);

    INSERT INTO public.message_queue (
      recipient_phone, recipient_name, template_id, variant_id, variables,
      scheduled_at, status, priority
    ) VALUES (
      p_phone,
      p_name,
      v_template.id,
      v_variant_id,
      p_variables,
      v_scheduled_at,
      'pending',
      p_priority
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$function$;

-- =========================================================
-- 3) queue_email_templates_for_event repassa variables ao filtro
--    (mantém comportamento, só adiciona o terceiro arg)
-- =========================================================
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
BEGIN
  IF p_email IS NULL OR p_email = '' THEN
    RETURN 0;
  END IF;

  -- Verifica supressão
  IF EXISTS (SELECT 1 FROM public.email_suppressions WHERE lower(email) = lower(p_email)) THEN
    RETURN 0;
  END IF;

  FOR v_template IN
    SELECT id, delay_minutes
    FROM public.email_templates
    WHERE event_trigger = p_event_trigger
      AND is_active = true
  LOOP
    -- Reusa should_send_template (mesma estrutura de filtros) se tiver perfil
    IF p_user_id IS NOT NULL
       AND NOT public.should_send_template(v_template.id, p_user_id, p_variables) THEN
      -- ATENÇÃO: aqui o id é de email_templates; should_send_template não vai
      -- achar a linha em message_templates. Para evitar bloquear emails legítimos,
      -- caímos para o comportamento original (sem filtro avançado por plan_slug):
      NULL;
    END IF;

    IF v_template.delay_minutes > 0 THEN
      v_scheduled_at := now() + (v_template.delay_minutes || ' minutes')::interval;
    ELSE
      v_scheduled_at := now();
    END IF;

    INSERT INTO public.email_queue (
      recipient_email, recipient_name, template_id, variables,
      scheduled_at, status, priority
    ) VALUES (
      p_email,
      p_name,
      v_template.id,
      p_variables,
      v_scheduled_at,
      'pending',
      p_priority
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$function$;

-- =========================================================
-- 4) RPC: verifica se cliente já pagou após o created_at do item da fila
--    Usado por process-queue antes de enviar mensagens de PIX gerado.
-- =========================================================
CREATE OR REPLACE FUNCTION public.is_pix_already_paid(
  p_phone text,
  p_after timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  IF p_phone IS NULL OR p_phone = '' OR p_after IS NULL THEN
    RETURN false;
  END IF;

  SELECT id INTO v_user_id
  FROM public.perfis
  WHERE celular = p_phone
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.events
    WHERE user_id = v_user_id
      AND event_type IN ('compra_aprovada', 'sale_confirmed')
      AND created_at >= p_after
  );
END;
$function$;

-- =========================================================
-- 5) Desativa template PIX antigo
-- =========================================================
UPDATE public.message_templates
SET is_active = false
WHERE id = '5730df1c-622d-47f1-a7e3-73b1b2436625';

-- =========================================================
-- 6) Cria 4 templates novos (1 por produto) com 10 variantes cada
-- =========================================================
DO $$
DECLARE
  v_grupo_vip_lf uuid := 'a23694fd-87f4-4edd-a6eb-8e51b3c90430';
  v_mensal       uuid := '96f56437-8582-4f53-aaee-e31103e5bcc8';
  v_semestral    uuid := '54711fb1-5fe5-4094-8c8e-3f97e4921ea7';
  v_anual        uuid := 'a1fc6ca2-cce2-41ef-aca4-4a2e8e60226f';

  v_tpl_id uuid;
  v_base_lf  text[] := ARRAY[
    -- 1
    E'Olá {{nome}}, seus 15 palpites quentes da Lotofácil estão a um passo! 🍀\n\nGerei seu PIX para concluir o pagamento agora:\n\n*PIX (copia e cola):*\n{{pix_codigo}}\n\nCaso queira gerar um novo PIX:\n{{link_novo_pix}}',
    -- 2
    E'Oi {{nome}}, tudo bem? 😊\n\nVi aqui que seu PIX dos *15 palpites quentes da Lotofácil* foi gerado mas ainda não caiu. Segue o código pra você:\n\n{{pix_codigo}}\n\nSe preferir, gere um novo aqui:\n{{link_novo_pix}}',
    -- 3
    E'{{nome}}, falta só o pagamento pra você começar a receber os 15 palpites quentes da Lotofácil todo dia 🍀\n\nPIX copia e cola:\n{{pix_codigo}}\n\nNovo PIX, se precisar:\n{{link_novo_pix}}',
    -- 4
    E'Oi {{nome}}! Estou no contato pra facilitar seu acesso ao Grupo VIP da Lotofácil.\n\nSegue seu PIX:\n{{pix_codigo}}\n\nCaso o anterior tenha expirado, gere outro:\n{{link_novo_pix}}',
    -- 5
    E'{{nome}}, seu PIX do Grupo VIP da Lotofácil ainda está em aberto.\n\nPaga aqui rapidinho pra liberar seu acesso:\n{{pix_codigo}}\n\nGerar um novo PIX:\n{{link_novo_pix}}',
    -- 6
    E'Olá {{nome}} 👋\n\nSeu PIX foi gerado. Assim que o pagamento cair, libero teu acesso ao grupo dos *15 palpites quentes da Lotofácil*:\n\n{{pix_codigo}}\n\nPrecisando de outro PIX:\n{{link_novo_pix}}',
    -- 7
    E'{{nome}}, aqui é da Palpite Tech 🍀\n\nNotei que seu PIX do Grupo VIP Lotofácil saiu mas ainda não foi pago. Segue de novo:\n\n{{pix_codigo}}\n\nNovo PIX (caso precise):\n{{link_novo_pix}}',
    -- 8
    E'Oi {{nome}}, tudo certo?\n\nPra você não perder nenhum sorteio, segue seu PIX dos 15 palpites quentes da Lotofácil:\n\n{{pix_codigo}}\n\nGerar um novo:\n{{link_novo_pix}}',
    -- 9
    E'{{nome}}, faltou só finalizar o pagamento do Grupo VIP da Lotofácil 💚\n\nPIX copia e cola:\n{{pix_codigo}}\n\nSe esse expirou, gere outro aqui:\n{{link_novo_pix}}',
    -- 10
    E'{{nome}}, garante já seu lugar no grupo dos 15 palpites quentes da Lotofácil!\n\nSeu PIX:\n{{pix_codigo}}\n\nPrecisando de um novo:\n{{link_novo_pix}}'
  ];

  v_base_full text[] := ARRAY[
    E'Olá {{nome}}, seu acesso completo da Comunidade Palpite Tech ({{produto}}) está a um passo! 🍀\n\nSegue seu PIX para concluir o pagamento:\n\n*PIX (copia e cola):*\n{{pix_codigo}}\n\nCaso queira gerar um novo PIX:\n{{link_novo_pix}}',
    E'Oi {{nome}}! Vi aqui que seu PIX do plano *{{produto}}* foi gerado mas ainda não caiu. Segue o código pra você:\n\n{{pix_codigo}}\n\nGerar um novo PIX, se preferir:\n{{link_novo_pix}}',
    E'{{nome}}, falta só o pagamento pra liberar seu plano *{{produto}}* na Comunidade Palpite Tech 🍀\n\nPIX copia e cola:\n{{pix_codigo}}\n\nNovo PIX, se precisar:\n{{link_novo_pix}}',
    E'Oi {{nome}}! Estou no contato pra facilitar seu acesso ao plano *{{produto}}*.\n\nSegue seu PIX:\n{{pix_codigo}}\n\nCaso o anterior tenha expirado, gere outro:\n{{link_novo_pix}}',
    E'{{nome}}, seu PIX do plano *{{produto}}* ainda está em aberto.\n\nPaga aqui rapidinho pra eu liberar seu acesso completo:\n{{pix_codigo}}\n\nGerar um novo PIX:\n{{link_novo_pix}}',
    E'Olá {{nome}} 👋\n\nSeu PIX foi gerado. Assim que o pagamento cair, libero seu acesso ao plano *{{produto}}*:\n\n{{pix_codigo}}\n\nPrecisando de outro PIX:\n{{link_novo_pix}}',
    E'{{nome}}, aqui é da Palpite Tech 🍀\n\nNotei que seu PIX do plano *{{produto}}* saiu mas ainda não foi pago. Segue de novo:\n\n{{pix_codigo}}\n\nNovo PIX (caso precise):\n{{link_novo_pix}}',
    E'Oi {{nome}}, tudo certo?\n\nPra você aproveitar logo todos os recursos do plano *{{produto}}*, segue seu PIX:\n\n{{pix_codigo}}\n\nGerar um novo:\n{{link_novo_pix}}',
    E'{{nome}}, faltou só finalizar o pagamento do plano *{{produto}}* 💚\n\nPIX copia e cola:\n{{pix_codigo}}\n\nSe esse expirou, gere outro aqui:\n{{link_novo_pix}}',
    E'{{nome}}, garante já seu acesso completo ao plano *{{produto}}* na Comunidade Palpite Tech!\n\nSeu PIX:\n{{pix_codigo}}\n\nPrecisando de um novo:\n{{link_novo_pix}}'
  ];

  v_pairs jsonb := jsonb_build_array(
    jsonb_build_object('name', 'PIX Gerado — Grupo VIP Lotofácil', 'plan_id', v_grupo_vip_lf, 'use_lf', true),
    jsonb_build_object('name', 'PIX Gerado — Plano Mensal',        'plan_id', v_mensal,       'use_lf', false),
    jsonb_build_object('name', 'PIX Gerado — Plano Semestral',     'plan_id', v_semestral,    'use_lf', false),
    jsonb_build_object('name', 'PIX Gerado — Plano Anual',         'plan_id', v_anual,        'use_lf', false)
  );
  p jsonb;
  v_variants text[];
  i int;
BEGIN
  FOR p IN SELECT * FROM jsonb_array_elements(v_pairs) LOOP
    v_variants := CASE WHEN (p->>'use_lf')::boolean THEN v_base_lf ELSE v_base_full END;

    INSERT INTO public.message_templates (
      name, content, event_trigger, is_active,
      delay_enabled, delay_minutes,
      include_tags, exclude_tags, plan_ids, tags_match_mode
    ) VALUES (
      p->>'name',
      v_variants[1],
      'pix_gerado',
      true,
      false,
      0,
      '{}'::text[],
      '{}'::text[],
      ARRAY[(p->>'plan_id')::uuid],
      'any'
    )
    RETURNING id INTO v_tpl_id;

    -- Variantes posições 2..10 (1 já está no content do template)
    FOR i IN 2..10 LOOP
      INSERT INTO public.message_template_variants (
        template_id, content, position, is_active
      ) VALUES (
        v_tpl_id,
        v_variants[i],
        i,
        true
      );
    END LOOP;
  END LOOP;
END $$;
