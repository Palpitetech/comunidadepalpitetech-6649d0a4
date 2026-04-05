
-- Add cooldown queue columns
ALTER TABLE public.whatsapp_instances
  ADD COLUMN IF NOT EXISTS cooldown_queue jsonb NOT NULL DEFAULT '[3]'::jsonb,
  ADD COLUMN IF NOT EXISTS cooldown_queue_index integer NOT NULL DEFAULT 0;

-- Migrate existing min_cooldown_minutes into cooldown_queue
UPDATE public.whatsapp_instances
SET cooldown_queue = jsonb_build_array(COALESCE(min_cooldown_minutes, 3))
WHERE cooldown_queue = '[3]'::jsonb AND min_cooldown_minutes IS NOT NULL AND min_cooldown_minutes != 3;

-- Update select_best_instance to use cooldown_queue
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
        COALESCE(
          (wi.cooldown_queue -> (wi.cooldown_queue_index % jsonb_array_length(wi.cooldown_queue)))::int,
          wi.min_cooldown_minutes
        ) || ' minutes'
      )::interval
    )
  ORDER BY wi.last_message_at ASC NULLS FIRST
  LIMIT 1;
END;
$$;

-- Update register_instance_usage to advance cooldown_queue_index
CREATE OR REPLACE FUNCTION public.register_instance_usage(p_instance_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.whatsapp_instances
  SET
    last_message_at = now(),
    messages_sent_today = COALESCE(messages_sent_today, 0) + 1,
    cooldown_queue_index = (cooldown_queue_index + 1) % jsonb_array_length(cooldown_queue)
  WHERE id = p_instance_id;
$$;
