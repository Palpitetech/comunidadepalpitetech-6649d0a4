
CREATE OR REPLACE FUNCTION public.increment_lead_webhook_count(webhook_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.lead_webhooks
  SET leads_count = leads_count + 1,
      last_lead_at = now(),
      updated_at = now()
  WHERE id = webhook_id;
$$;
