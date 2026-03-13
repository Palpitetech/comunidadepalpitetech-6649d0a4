-- 1. Proteger view kirvano_webhook_logs_masked com SECURITY INVOKER
DROP VIEW IF EXISTS public.kirvano_webhook_logs_masked;

CREATE VIEW public.kirvano_webhook_logs_masked
WITH (security_invoker = true)
AS
SELECT 
    k.id,
    k.received_at,
    k.processed,
    k.event,
    k.status,
    k.payment_method,
    k.purchase_type,
    k.authorized_method,
    k.process_result,
    k.error,
    k.checkout_id,
    k.sale_id,
    -- Masked fields
    CASE 
      WHEN k.email IS NOT NULL THEN 
        LEFT(k.email, 2) || '***' || SUBSTRING(k.email FROM POSITION('@' IN k.email))
      ELSE NULL 
    END AS email_masked,
    CASE 
      WHEN k.phone IS NOT NULL THEN 
        LEFT(k.phone, 4) || '****' || RIGHT(k.phone, 2)
      ELSE NULL 
    END AS phone_masked,
    -- Full fields (only visible if caller has admin RLS access)
    k.email,
    k.phone,
    k.raw_payload,
    -- Safe payload without sensitive keys
    k.raw_payload - ARRAY['customer_email', 'customer_phone', 'customer_document'] AS raw_payload_safe
FROM public.kirvano_webhook_logs k;