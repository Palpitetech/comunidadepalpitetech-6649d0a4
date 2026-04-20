-- 1. Tabela de variantes
CREATE TABLE IF NOT EXISTS public.message_template_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.message_templates(id) ON DELETE CASCADE,
  content text NOT NULL,
  position integer NOT NULL CHECK (position BETWEEN 1 AND 10),
  is_active boolean NOT NULL DEFAULT true,
  times_used integer NOT NULL DEFAULT 0,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, position)
);

CREATE INDEX IF NOT EXISTS idx_template_variants_template ON public.message_template_variants(template_id, position);

ALTER TABLE public.message_template_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam variants"
  ON public.message_template_variants
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role acesso variants"
  ON public.message_template_variants
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 2. Round robin pointer no template
ALTER TABLE public.message_templates
  ADD COLUMN IF NOT EXISTS last_variant_position integer NOT NULL DEFAULT 0;

-- 3. Variant ID na fila (auditoria)
ALTER TABLE public.message_queue
  ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES public.message_template_variants(id) ON DELETE SET NULL;

-- 4. Função round robin
CREATE OR REPLACE FUNCTION public.pick_template_variant(p_template_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_last_pos integer;
  v_variant record;
BEGIN
  SELECT last_variant_position INTO v_last_pos
  FROM public.message_templates
  WHERE id = p_template_id;

  IF v_last_pos IS NULL THEN
    RETURN NULL;
  END IF;

  -- Próxima variante ativa após v_last_pos (em ordem de position)
  SELECT id, position INTO v_variant
  FROM public.message_template_variants
  WHERE template_id = p_template_id
    AND is_active = true
    AND position > v_last_pos
  ORDER BY position ASC
  LIMIT 1;

  -- Se não achou após, volta para a primeira
  IF v_variant.id IS NULL THEN
    SELECT id, position INTO v_variant
    FROM public.message_template_variants
    WHERE template_id = p_template_id
      AND is_active = true
    ORDER BY position ASC
    LIMIT 1;
  END IF;

  IF v_variant.id IS NULL THEN
    RETURN NULL; -- nenhuma variante ativa, fallback para content
  END IF;

  -- Atualiza pointer e métricas
  UPDATE public.message_templates
  SET last_variant_position = v_variant.position
  WHERE id = p_template_id;

  UPDATE public.message_template_variants
  SET times_used = times_used + 1,
      last_used_at = now()
  WHERE id = v_variant.id;

  RETURN v_variant.id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'pick_template_variant erro: %', SQLERRM;
    RETURN NULL;
END;
$$;

-- 5. Atualizar queue_templates_for_event para incluir variant_id
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
    IF p_user_id IS NOT NULL AND NOT public.should_send_template(v_template.id, p_user_id) THEN
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
$$;

-- 6. Trigger para updated_at em variants
CREATE TRIGGER update_message_template_variants_updated_at
  BEFORE UPDATE ON public.message_template_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();