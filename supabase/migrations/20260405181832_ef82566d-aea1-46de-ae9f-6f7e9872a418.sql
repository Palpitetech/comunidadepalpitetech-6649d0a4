
-- Add per-instance cooldown column
ALTER TABLE public.whatsapp_instances
  ADD COLUMN min_cooldown_minutes integer NOT NULL DEFAULT 3;

-- Centralized function to select the best available instance
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
      OR wi.last_message_at <= now() - (wi.min_cooldown_minutes || ' minutes')::interval
    )
  ORDER BY wi.last_message_at ASC NULLS FIRST
  LIMIT 1;
END;
$$;

-- Centralized function to register usage after sending a message
CREATE OR REPLACE FUNCTION public.register_instance_usage(p_instance_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.whatsapp_instances
  SET
    last_message_at = now(),
    messages_sent_today = COALESCE(messages_sent_today, 0) + 1
  WHERE id = p_instance_id;
$$;
