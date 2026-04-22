
-- Tabela de auditoria de chamadas ao merge_user_attribution
CREATE TABLE IF NOT EXISTS public.attribution_merge_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  source text NOT NULL DEFAULT 'unknown',
  attribution_before jsonb NOT NULL DEFAULT '{}'::jsonb,
  attribution_after jsonb NOT NULL DEFAULT '{}'::jsonb,
  new_attr_input jsonb NOT NULL DEFAULT '{}'::jsonb,
  fields_added text[] NOT NULL DEFAULT '{}'::text[],
  fields_skipped text[] NOT NULL DEFAULT '{}'::text[],
  marked_purchase boolean NOT NULL DEFAULT false,
  user_existed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attribution_merge_logs_user_id ON public.attribution_merge_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_attribution_merge_logs_created_at ON public.attribution_merge_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attribution_merge_logs_source ON public.attribution_merge_logs(source);

ALTER TABLE public.attribution_merge_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ler attribution_merge_logs"
  ON public.attribution_merge_logs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role pode inserir attribution_merge_logs"
  ON public.attribution_merge_logs FOR INSERT
  TO public
  WITH CHECK (auth.role() = 'service_role'::text OR has_role(auth.uid(), 'admin'::app_role));

-- Recria função com auditoria + parâmetro de origem
CREATE OR REPLACE FUNCTION public.merge_user_attribution(
  p_user_id uuid,
  p_new_attr jsonb,
  p_mark_purchase boolean DEFAULT false,
  p_purchase_at timestamptz DEFAULT NULL,
  p_source text DEFAULT 'unknown'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current jsonb;
  v_merged jsonb;
  v_key text;
  v_val text;
  v_email text;
  v_celular text;
  v_lead_id uuid;
  v_fields_added text[] := '{}'::text[];
  v_fields_skipped text[] := '{}'::text[];
  v_user_existed boolean := true;
BEGIN
  IF p_user_id IS NULL THEN
    INSERT INTO public.attribution_merge_logs(user_id, source, new_attr_input, user_existed)
    VALUES (NULL, p_source, COALESCE(p_new_attr,'{}'::jsonb), false);
    RETURN;
  END IF;

  SELECT attribution, email, celular
    INTO v_current, v_email, v_celular
    FROM public.perfis
   WHERE id = p_user_id;

  IF NOT FOUND THEN
    v_user_existed := false;
    INSERT INTO public.attribution_merge_logs(user_id, source, new_attr_input, user_existed)
    VALUES (p_user_id, p_source, COALESCE(p_new_attr,'{}'::jsonb), false);
    RETURN;
  END IF;

  v_current := COALESCE(v_current, '{}'::jsonb);
  v_merged := v_current;

  -- First-touch: só preenche chaves ausentes/vazias
  IF p_new_attr IS NOT NULL THEN
    FOR v_key, v_val IN
      SELECT key, value::text FROM jsonb_each_text(p_new_attr)
    LOOP
      IF v_val IS NOT NULL AND v_val <> '' AND v_val <> 'null' THEN
        IF NOT (v_merged ? v_key) OR COALESCE(v_merged->>v_key, '') = '' THEN
          v_merged := v_merged || jsonb_build_object(v_key, v_val);
          v_fields_added := array_append(v_fields_added, v_key);
        ELSE
          v_fields_skipped := array_append(v_fields_skipped, v_key);
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Stamp first_signup_at se vazio
  IF NOT (v_merged ? 'first_signup_at') OR COALESCE(v_merged->>'first_signup_at','') = '' THEN
    v_merged := v_merged || jsonb_build_object('first_signup_at', now()::text);
    v_fields_added := array_append(v_fields_added, 'first_signup_at');
  END IF;

  -- Atualiza perfil
  UPDATE public.perfis
     SET attribution = v_merged,
         utm_source = COALESCE(NULLIF(utm_source, ''), v_merged->>'utm_source'),
         first_purchase_at = CASE
           WHEN p_mark_purchase AND first_purchase_at IS NULL
             THEN COALESCE(p_purchase_at, now())
           ELSE first_purchase_at
         END,
         updated_at = now()
   WHERE id = p_user_id;

  -- Vincula lead → perfil se possível
  IF v_email IS NOT NULL OR v_celular IS NOT NULL THEN
    UPDATE public.leads_inbox
       SET perfil_id = p_user_id, updated_at = now()
     WHERE perfil_id IS NULL
       AND (
         (v_email IS NOT NULL AND lower(email) = lower(v_email))
         OR (v_celular IS NOT NULL AND celular = v_celular)
       );
  END IF;

  -- Registra auditoria
  INSERT INTO public.attribution_merge_logs(
    user_id, source, attribution_before, attribution_after,
    new_attr_input, fields_added, fields_skipped, marked_purchase, user_existed
  ) VALUES (
    p_user_id, p_source, v_current, v_merged,
    COALESCE(p_new_attr,'{}'::jsonb), v_fields_added, v_fields_skipped,
    p_mark_purchase, v_user_existed
  );
END;
$function$;
