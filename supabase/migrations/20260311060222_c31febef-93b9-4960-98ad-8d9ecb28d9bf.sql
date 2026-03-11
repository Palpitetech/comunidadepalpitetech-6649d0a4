
-- TABELA 1: whatsapp_instances
CREATE TABLE public.whatsapp_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  friendly_name text NOT NULL,
  phone_number text NOT NULL,
  evolution_instance_id text NOT NULL,
  status text DEFAULT 'offline',
  daily_limit integer DEFAULT 100,
  messages_sent_today integer DEFAULT 0,
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins podem gerenciar whatsapp_instances" ON public.whatsapp_instances FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role acesso whatsapp_instances" ON public.whatsapp_instances FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- TABELA 2: message_templates
CREATE TABLE public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  content text NOT NULL,
  event_trigger text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins podem gerenciar message_templates" ON public.message_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role acesso message_templates" ON public.message_templates FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- TABELA 3: message_queue
CREATE TABLE public.message_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid REFERENCES public.whatsapp_instances(id),
  template_id uuid REFERENCES public.message_templates(id),
  recipient_phone text NOT NULL,
  recipient_name text,
  variables jsonb DEFAULT '{}',
  status text DEFAULT 'pending',
  scheduled_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  error_message text,
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.message_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins podem gerenciar message_queue" ON public.message_queue FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role acesso message_queue" ON public.message_queue FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- TABELA 4: send_logs
CREATE TABLE public.send_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid REFERENCES public.message_queue(id),
  instance_id uuid REFERENCES public.whatsapp_instances(id),
  recipient_phone text NOT NULL,
  message_content text,
  status text,
  sent_at timestamptz DEFAULT now()
);
ALTER TABLE public.send_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins podem gerenciar send_logs" ON public.send_logs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role acesso send_logs" ON public.send_logs FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- TABELA 5: warming_schedule
CREATE TABLE public.warming_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  window_name text NOT NULL,
  day_type text NOT NULL,
  hour_start integer NOT NULL,
  hour_end integer NOT NULL,
  theme text NOT NULL,
  min_messages integer DEFAULT 2,
  max_messages integer DEFAULT 4,
  is_active boolean DEFAULT true
);
ALTER TABLE public.warming_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins podem gerenciar warming_schedule" ON public.warming_schedule FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role acesso warming_schedule" ON public.warming_schedule FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- TABELA 6: warming_rotation
CREATE TABLE public.warming_rotation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  window_name text NOT NULL UNIQUE,
  last_pair text,
  last_used_at timestamptz
);
ALTER TABLE public.warming_rotation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins podem gerenciar warming_rotation" ON public.warming_rotation FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role acesso warming_rotation" ON public.warming_rotation FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- TABELA 7: warming_logs
CREATE TABLE public.warming_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_instance_id uuid NOT NULL REFERENCES public.whatsapp_instances(id),
  to_instance_id uuid NOT NULL REFERENCES public.whatsapp_instances(id),
  message_content text,
  window_name text,
  sent_at timestamptz DEFAULT now()
);
ALTER TABLE public.warming_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins podem gerenciar warming_logs" ON public.warming_logs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role acesso warming_logs" ON public.warming_logs FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- TRIGGER 1: Novo Lead (perfis)
CREATE OR REPLACE FUNCTION public.trigger_queue_lead_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_template_id uuid;
BEGIN
  IF NEW.celular IS NULL OR NEW.celular = '' THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_template_id
  FROM public.message_templates
  WHERE event_trigger = 'lead_created'
  LIMIT 1;

  IF v_template_id IS NOT NULL THEN
    INSERT INTO public.message_queue (recipient_phone, recipient_name, template_id, variables, scheduled_at, status)
    VALUES (
      NEW.celular,
      NEW.nome,
      v_template_id,
      jsonb_build_object('nome', COALESCE(NEW.nome, ''), 'telefone', COALESCE(NEW.celular, '')),
      now(),
      'pending'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_lead_queue_message
  AFTER INSERT ON public.perfis
  FOR EACH ROW EXECUTE FUNCTION public.trigger_queue_lead_message();

-- TRIGGER 2: Nova Venda (kirvano_webhook_logs)
CREATE OR REPLACE FUNCTION public.trigger_queue_sale_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_template_id uuid;
  v_phone text;
  v_nome text;
  v_produto text;
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

  SELECT id INTO v_template_id
  FROM public.message_templates
  WHERE event_trigger = 'sale_confirmed'
  LIMIT 1;

  IF v_template_id IS NOT NULL THEN
    INSERT INTO public.message_queue (recipient_phone, recipient_name, template_id, variables, scheduled_at, status)
    VALUES (
      v_phone,
      v_nome,
      v_template_id,
      jsonb_build_object('nome', v_nome, 'telefone', v_phone, 'produto', v_produto),
      now(),
      'pending'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_sale_queue_message
  AFTER INSERT ON public.kirvano_webhook_logs
  FOR EACH ROW EXECUTE FUNCTION public.trigger_queue_sale_message();
