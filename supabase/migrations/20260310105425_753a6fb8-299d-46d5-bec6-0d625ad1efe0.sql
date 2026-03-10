
-- Fix: Change view to SECURITY INVOKER (default, not security definer)
DROP VIEW IF EXISTS public.kirvano_webhook_logs_masked;

CREATE VIEW public.kirvano_webhook_logs_masked
WITH (security_invoker = true)
AS
SELECT
  id,
  received_at,
  event,
  status,
  CASE
    WHEN email IS NOT NULL THEN
      LEFT(email, 2) || '***' || SUBSTRING(email FROM POSITION('@' IN email))
    ELSE NULL
  END AS email_masked,
  CASE
    WHEN phone IS NOT NULL THEN
      LEFT(phone, 3) || '****' || RIGHT(phone, 2)
    ELSE NULL
  END AS phone_masked,
  email,
  phone,
  checkout_id,
  sale_id,
  payment_method,
  purchase_type,
  authorized_method,
  process_result,
  error,
  processed,
  raw_payload - 'customer' - 'payer' AS raw_payload_safe,
  raw_payload
FROM public.kirvano_webhook_logs;
