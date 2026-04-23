CREATE OR REPLACE FUNCTION public.incrementar_uso_gerador(
  p_user_id uuid,
  p_max integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := CURRENT_DATE;
  v_count integer;
BEGIN
  INSERT INTO public.gerador_daily_usage (user_id, day, count)
  VALUES (p_user_id, v_today, 1)
  ON CONFLICT (user_id, day) DO UPDATE
    SET count = public.gerador_daily_usage.count + 1,
        updated_at = timezone('utc'::text, now())
  RETURNING count INTO v_count;

  IF p_max > 0 AND v_count > p_max THEN
    UPDATE public.gerador_daily_usage
       SET count = count - 1,
           updated_at = timezone('utc'::text, now())
     WHERE user_id = p_user_id AND day = v_today;
    RAISE EXCEPTION 'LIMIT_REACHED' USING ERRCODE = 'P0001';
  END IF;

  RETURN GREATEST(p_max - v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.incrementar_uso_gerador(uuid, integer) TO service_role;