-- Set a known webhook secret value in admin_settings
-- This will be read by triggers to authenticate calls to edge functions
UPDATE public.admin_settings 
SET notifications_webhook_secret = 'palpitetech-push-internal-2026-secure'
WHERE id = 'default';