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