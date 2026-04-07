ALTER TABLE public.whatsapp_instances
ADD COLUMN IF NOT EXISTS webhook_configured boolean NOT NULL DEFAULT false;