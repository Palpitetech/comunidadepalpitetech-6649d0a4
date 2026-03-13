
-- 1. Add lead_webhook_token to admin_settings
ALTER TABLE public.admin_settings
ADD COLUMN lead_webhook_token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex');

-- 2. Create system_events table
CREATE TABLE public.system_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  description text,
  source text DEFAULT 'system',
  status text DEFAULT 'success',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "Admins podem ler system_events"
ON public.system_events FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert
CREATE POLICY "Service role pode inserir system_events"
ON public.system_events FOR INSERT
TO public
WITH CHECK (auth.role() = 'service_role'::text);
