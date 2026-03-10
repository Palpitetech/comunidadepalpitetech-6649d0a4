-- Add notifications webhook secret to admin_settings
ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS notifications_webhook_secret text DEFAULT '';