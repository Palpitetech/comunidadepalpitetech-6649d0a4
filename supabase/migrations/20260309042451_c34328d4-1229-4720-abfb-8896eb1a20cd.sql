
ALTER TABLE public.admin_settings
ADD COLUMN kirvano_webhook_token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex');
