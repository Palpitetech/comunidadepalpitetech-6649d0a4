-- 1) Colunas novas em perfis
ALTER TABLE public.perfis
  ADD COLUMN IF NOT EXISTS attribution jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS first_purchase_at timestamptz;

-- 2) Índices para filtros e ordenação
CREATE INDEX IF NOT EXISTS idx_perfis_attribution_gin
  ON public.perfis USING GIN (attribution);

CREATE INDEX IF NOT EXISTS idx_perfis_first_purchase_at
  ON public.perfis (first_purchase_at);

CREATE INDEX IF NOT EXISTS idx_perfis_attribution_utm_source
  ON public.perfis ((attribution->>'utm_source'));

-- 3) Função first-touch: só preenche campos vazios
CREATE OR REPLACE FUNCTION public.merge_user_attribution(
  p_user_id uuid,
  p_new_attr jsonb,
  p_mark_purchase boolean DEFAULT false,
  p_purchase_at timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current jsonb;
  v_merged jsonb;
  v_key text;
  v_val text;
  v_email text;
  v_celular text;
  v_lead_id uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT attribution, email, celular
    INTO v_current, v_email, v_celular
    FROM public.perfis
   WHERE id = p_user_id;

  IF NOT FOUND THEN
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
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Stamp first_signup_at se vazio
  IF NOT (v_merged ? 'first_signup_at') OR COALESCE(v_merged->>'first_signup_at','') = '' THEN
    v_merged := v_merged || jsonb_build_object('first_signup_at', now()::text);
  END IF;

  -- Stamp first_purchase_at quando aplicável
  IF p_mark_purchase THEN
    IF NOT (v_merged ? 'first_purchase_at') OR COALESCE(v_merged->>'first_purchase_at','') = '' THEN
      v_merged := v_merged || jsonb_build_object('first_purchase_at', COALESCE(p_purchase_at, now())::text);
    END IF;
  END IF;

  -- Update perfil (bypass triggers de proteção via session var não é necessário,
  -- pois attribution e first_purchase_at não estão na lista bloqueada)
  PERFORM set_config('app.bypass_subscription_checks', 'true', true);

  UPDATE public.perfis
     SET attribution = v_merged,
         utm_source = COALESCE(NULLIF(v_merged->>'utm_source',''), utm_source),
         first_purchase_at = CASE
           WHEN p_mark_purchase AND first_purchase_at IS NULL
             THEN COALESCE(p_purchase_at, now())
           ELSE first_purchase_at
         END
   WHERE id = p_user_id;

  PERFORM set_config('app.bypass_subscription_checks', 'false', true);

  -- Vincula lead em leads_inbox (por email/celular) se ainda não vinculado
  IF v_email IS NOT NULL OR v_celular IS NOT NULL THEN
    SELECT id INTO v_lead_id
      FROM public.leads_inbox
     WHERE perfil_id IS NULL
       AND (
         (v_email IS NOT NULL AND lower(email) = lower(v_email))
         OR (v_celular IS NOT NULL AND celular = v_celular)
       )
     ORDER BY created_at ASC
     LIMIT 1;

    IF v_lead_id IS NOT NULL THEN
      UPDATE public.leads_inbox
         SET perfil_id = p_user_id,
             updated_at = now()
       WHERE id = v_lead_id;
    END IF;
  END IF;
END;
$$;

-- 4) Permite chamar a função a partir de edge functions (service_role) e usuários autenticados
GRANT EXECUTE ON FUNCTION public.merge_user_attribution(uuid, jsonb, boolean, timestamptz) TO authenticated, service_role, anon;