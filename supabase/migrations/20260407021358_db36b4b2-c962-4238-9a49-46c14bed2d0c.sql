
-- 1. Add segmentation columns to message_templates
ALTER TABLE public.message_templates
  ADD COLUMN IF NOT EXISTS include_tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS exclude_tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS plan_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tags_match_mode text NOT NULL DEFAULT 'any';

-- 2. Create should_send_template function
CREATE OR REPLACE FUNCTION public.should_send_template(p_template_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template record;
  v_perfil record;
BEGIN
  SELECT include_tags, exclude_tags, plan_ids, tags_match_mode
  INTO v_template
  FROM public.message_templates
  WHERE id = p_template_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- No filters = send to everyone (backward compatible)
  IF array_length(v_template.include_tags, 1) IS NULL
     AND array_length(v_template.exclude_tags, 1) IS NULL
     AND array_length(v_template.plan_ids, 1) IS NULL THEN
    RETURN true;
  END IF;

  SELECT tags, plan_id INTO v_perfil
  FROM public.perfis
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check include_tags
  IF array_length(v_template.include_tags, 1) IS NOT NULL THEN
    IF v_template.tags_match_mode = 'all' THEN
      -- ALL: user must have all include_tags
      IF NOT (v_perfil.tags @> v_template.include_tags) THEN
        RETURN false;
      END IF;
    ELSE
      -- ANY: user must have at least one include_tag
      IF NOT (v_perfil.tags && v_template.include_tags) THEN
        RETURN false;
      END IF;
    END IF;
  END IF;

  -- Check exclude_tags: if user has ANY exclude tag, block
  IF array_length(v_template.exclude_tags, 1) IS NOT NULL THEN
    IF v_perfil.tags && v_template.exclude_tags THEN
      RETURN false;
    END IF;
  END IF;

  -- Check plan_ids
  IF array_length(v_template.plan_ids, 1) IS NOT NULL THEN
    IF v_perfil.plan_id IS NULL OR NOT (v_perfil.plan_id = ANY(v_template.plan_ids)) THEN
      RETURN false;
    END IF;
  END IF;

  RETURN true;
END;
$$;

-- 3. Update trigger_queue_lead_message to use segmentation
CREATE OR REPLACE FUNCTION public.trigger_queue_lead_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_template record;
  v_scheduled_at timestamptz;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.celular IS NOT NULL)
  OR (TG_OP = 'UPDATE' AND NEW.celular IS NOT NULL AND OLD.celular IS NULL)
  THEN
    SELECT id, delay_enabled, delay_minutes INTO v_template
    FROM public.message_templates
    WHERE event_trigger = 'novo_cadastro'
      AND is_active = true
    LIMIT 1;

    IF v_template.id IS NOT NULL THEN
      -- Check segmentation
      IF NOT public.should_send_template(v_template.id, NEW.id) THEN
        RETURN NEW;
      END IF;

      IF v_template.delay_enabled AND v_template.delay_minutes > 0 THEN
        v_scheduled_at := now() + (v_template.delay_minutes || ' minutes')::interval;
      ELSE
        v_scheduled_at := now();
      END IF;

      INSERT INTO public.message_queue (recipient_phone, recipient_name, template_id, variables, scheduled_at, status)
      VALUES (
        NEW.celular,
        NEW.nome,
        v_template.id,
        jsonb_build_object('nome', COALESCE(NEW.nome, ''), 'telefone', COALESCE(NEW.celular, ''), 'email', COALESCE(NEW.email, '')),
        v_scheduled_at,
        'pending'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 4. Update trigger_queue_sale_message to use segmentation
CREATE OR REPLACE FUNCTION public.trigger_queue_sale_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_template record;
  v_phone text;
  v_nome text;
  v_produto text;
  v_user_id uuid;
BEGIN
  IF NEW.status IS DISTINCT FROM 'approved' THEN
    RETURN NEW;
  END IF;

  v_phone := NEW.phone;
  IF v_phone IS NULL OR v_phone = '' THEN
    RETURN NEW;
  END IF;

  v_nome := COALESCE(NEW.raw_payload->>'customer_name', NEW.raw_payload->'customer'->>'name', '');
  v_produto := COALESCE(NEW.raw_payload->>'product_name', NEW.raw_payload->'product'->>'name', '');

  SELECT id INTO v_template
  FROM public.message_templates
  WHERE event_trigger = 'sale_confirmed'
    AND is_active = true
  LIMIT 1;

  IF v_template.id IS NOT NULL THEN
    -- Try to find user by phone for segmentation check
    SELECT p.id INTO v_user_id
    FROM public.perfis p
    WHERE p.celular = v_phone
    LIMIT 1;

    -- If user found, check segmentation; if not found, send anyway
    IF v_user_id IS NOT NULL AND NOT public.should_send_template(v_template.id, v_user_id) THEN
      RETURN NEW;
    END IF;

    INSERT INTO public.message_queue (recipient_phone, recipient_name, template_id, variables, scheduled_at, status)
    VALUES (
      v_phone,
      v_nome,
      v_template.id,
      jsonb_build_object('nome', v_nome, 'telefone', v_phone, 'produto', v_produto),
      now(),
      'pending'
    );
  END IF;

  RETURN NEW;
END;
$function$;
