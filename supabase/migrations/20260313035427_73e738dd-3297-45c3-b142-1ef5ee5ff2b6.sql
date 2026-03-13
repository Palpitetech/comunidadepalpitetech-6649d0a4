CREATE OR REPLACE FUNCTION public.trigger_queue_lead_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_template_id uuid;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.celular IS NOT NULL)
  OR (TG_OP = 'UPDATE' AND NEW.celular IS NOT NULL AND OLD.celular IS NULL)
  THEN
    SELECT id INTO v_template_id
    FROM public.message_templates
    WHERE event_trigger = 'novo_cadastro'
      AND is_active = true
    LIMIT 1;

    IF v_template_id IS NOT NULL THEN
      INSERT INTO public.message_queue (recipient_phone, recipient_name, template_id, variables, scheduled_at, status)
      VALUES (
        NEW.celular,
        NEW.nome,
        v_template_id,
        jsonb_build_object('nome', COALESCE(NEW.nome, ''), 'telefone', COALESCE(NEW.celular, ''), 'email', COALESCE(NEW.email, '')),
        now(),
        'pending'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;