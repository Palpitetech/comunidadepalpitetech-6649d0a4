
-- 1. Drop legacy column
ALTER TABLE public.whatsapp_instances DROP COLUMN IF EXISTS min_cooldown_minutes;

-- 2. Update select_best_instance to remove fallback to min_cooldown_minutes
CREATE OR REPLACE FUNCTION public.select_best_instance()
RETURNS TABLE(
  instance_id uuid,
  evolution_instance_id text,
  phone_number text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wi.id AS instance_id,
    wi.evolution_instance_id,
    wi.phone_number
  FROM public.whatsapp_instances wi
  WHERE wi.status = 'online'
    AND COALESCE(wi.messages_sent_today, 0) < COALESCE(wi.daily_limit, 100)
    AND (
      wi.last_message_at IS NULL
      OR wi.last_message_at <= now() - (
        (wi.cooldown_queue -> (wi.cooldown_queue_index % jsonb_array_length(wi.cooldown_queue)))::int || ' minutes'
      )::interval
    )
  ORDER BY wi.last_message_at ASC NULLS FIRST
  LIMIT 1;
END;
$$;

-- 3. Create register_warming_usage (advances cooldown index + last_message_at but NOT messages_sent_today)
CREATE OR REPLACE FUNCTION public.register_warming_usage(p_instance_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.whatsapp_instances
  SET
    last_message_at = now(),
    cooldown_queue_index = (cooldown_queue_index + 1) % jsonb_array_length(cooldown_queue)
  WHERE id = p_instance_id;
$$;
