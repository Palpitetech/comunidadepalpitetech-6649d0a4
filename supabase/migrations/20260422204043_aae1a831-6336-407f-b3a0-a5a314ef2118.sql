CREATE OR REPLACE FUNCTION public._message_queue_dedupe_window(p_created_at timestamptz)
RETURNS tstzrange
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
  SELECT tstzrange(p_created_at, p_created_at + (7 * interval '1 day'), '[)');
$$;