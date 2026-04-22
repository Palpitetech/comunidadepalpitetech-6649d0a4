CREATE OR REPLACE FUNCTION public.find_user_by_contact(
  p_email text DEFAULT NULL,
  p_celular text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_found_email text;
  v_found_celular text;
BEGIN
  IF p_email IS NOT NULL AND p_email <> '' THEN
    SELECT id, email, celular INTO v_id, v_found_email, v_found_celular
    FROM public.perfis
    WHERE lower(email) = lower(p_email) AND COALESCE(is_bot, false) = false
    LIMIT 1;
    IF v_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'user_id', v_id,
        'found_by', 'email',
        'email', v_found_email,
        'celular', v_found_celular
      );
    END IF;
  END IF;

  IF p_celular IS NOT NULL AND p_celular <> '' THEN
    SELECT id, email, celular INTO v_id, v_found_email, v_found_celular
    FROM public.perfis
    WHERE celular = p_celular AND COALESCE(is_bot, false) = false
    LIMIT 1;
    IF v_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'user_id', v_id,
        'found_by', 'celular',
        'email', v_found_email,
        'celular', v_found_celular
      );
    END IF;
  END IF;

  RETURN jsonb_build_object('user_id', null, 'found_by', null);
END;
$$;

CREATE INDEX IF NOT EXISTS idx_perfis_email_lower
  ON public.perfis (lower(email))
  WHERE COALESCE(is_bot, false) = false;