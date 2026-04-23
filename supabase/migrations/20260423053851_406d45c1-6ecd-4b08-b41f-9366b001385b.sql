CREATE OR REPLACE FUNCTION public.select_best_instances(p_limit int DEFAULT 5)
RETURNS TABLE(instance_id uuid, evolution_instance_id text, phone_number text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN QUERY
  SELECT wi.id, wi.evolution_instance_id, wi.phone_number
  FROM public.whatsapp_instances wi
  WHERE wi.status = 'online'
    AND COALESCE(wi.messages_sent_today, 0) < COALESCE(wi.daily_limit, 100)
    AND (
      wi.last_message_at IS NULL
      OR wi.last_message_at <= now() - (
        COALESCE(
          (wi.cooldown_queue -> (COALESCE(wi.cooldown_queue_index, 0) % NULLIF(jsonb_array_length(wi.cooldown_queue), 0)))::int,
          1
        ) || ' minutes'
      )::interval
    )
  ORDER BY wi.last_message_at ASC NULLS FIRST
  LIMIT p_limit;
END;
$$;