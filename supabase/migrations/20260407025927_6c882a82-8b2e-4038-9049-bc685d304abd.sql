
-- Etapa 1: Criar função genérica queue_templates_for_event
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
AS $$
DECLARE
  v_template record;
  v_scheduled_at timestamptz;
  v_count integer := 0;
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
    -- Check segmentation (tags, plan, match mode) if user_id is provided
    IF p_user_id IS NOT NULL AND NOT public.should_send_template(v_template.id, p_user_id) THEN
      CONTINUE;
    END IF;

    -- Calculate scheduled_at with optional delay
    IF v_template.delay_enabled AND v_template.delay_minutes > 0 THEN
      v_scheduled_at := now() + (v_template.delay_minutes || ' minutes')::interval;
    ELSE
      v_scheduled_at := now();
    END IF;

    INSERT INTO public.message_queue (
      recipient_phone, recipient_name, template_id, variables,
      scheduled_at, status, priority
    ) VALUES (
      p_phone,
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
$$;

-- Etapa 2: Criar trigger genérico na tabela events
CREATE OR REPLACE FUNCTION public.trigger_queue_event_templates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_perfil record;
  v_priority integer;
  v_variables jsonb;
BEGIN
  -- Lookup user profile for phone, name and variables
  SELECT id, celular, nome, email, plan_id
  INTO v_perfil
  FROM public.perfis
  WHERE id = NEW.user_id;

  -- Skip if no profile or no phone
  IF NOT FOUND OR v_perfil.celular IS NULL OR v_perfil.celular = '' THEN
    RETURN NEW;
  END IF;

  -- Map event priorities
  v_priority := CASE NEW.event_type
    WHEN 'novo_cadastro' THEN 10
    WHEN 'sale_confirmed' THEN 10
    WHEN 'subscription_expired' THEN 8
    WHEN 'carrinho_abandonado' THEN 5
    ELSE 5
  END;

  -- Build variables from event metadata + profile
  v_variables := COALESCE(NEW.metadata, '{}'::jsonb) || jsonb_build_object(
    'nome', COALESCE(v_perfil.nome, ''),
    'telefone', COALESCE(v_perfil.celular, ''),
    'email', COALESCE(v_perfil.email, '')
  );

  -- Queue all matching templates
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
$$;

-- Create the trigger on events table
CREATE TRIGGER on_event_queue_templates
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_queue_event_templates();

-- Etapa 2.4: Drop old lead trigger from perfis (now handled via events table)
DROP TRIGGER IF EXISTS on_new_lead_queue_message ON public.perfis;
DROP FUNCTION IF EXISTS public.trigger_queue_lead_message();

-- Update sale trigger to use the new generic function
CREATE OR REPLACE FUNCTION public.trigger_queue_sale_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_phone text;
  v_nome text;
  v_produto text;
  v_user_id uuid;
  v_variables jsonb;
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

  -- Try to find user by phone
  SELECT p.id INTO v_user_id
  FROM public.perfis p
  WHERE p.celular = v_phone
  LIMIT 1;

  v_variables := jsonb_build_object(
    'nome', v_nome,
    'telefone', v_phone,
    'produto', v_produto
  );

  -- Use the generic function
  PERFORM public.queue_templates_for_event(
    'sale_confirmed',
    v_phone,
    v_nome,
    v_user_id,
    v_variables,
    10  -- high priority for sales
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro em trigger_queue_sale_message: %', SQLERRM;
    RETURN NEW;
END;
$$;
