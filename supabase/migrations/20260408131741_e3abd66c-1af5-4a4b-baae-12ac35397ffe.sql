-- Recriar a view mascarada removendo colunas sensíveis expostas
DROP VIEW IF EXISTS public.kirvano_webhook_logs_masked;

CREATE VIEW public.kirvano_webhook_logs_masked AS
SELECT
  id,
  received_at,
  processed,
  event,
  status,
  payment_method,
  purchase_type,
  authorized_method,
  process_result,
  error,
  checkout_id,
  sale_id,
  CASE
    WHEN email IS NOT NULL THEN LEFT(email, 2) || '***' || SUBSTRING(email FROM POSITION('@' IN email))
    ELSE NULL
  END AS email_masked,
  CASE
    WHEN phone IS NOT NULL THEN LEFT(phone, 4) || '****' || RIGHT(phone, 2)
    ELSE NULL
  END AS phone_masked,
  (raw_payload - ARRAY['customer_email', 'customer_phone', 'customer_document', 'customer_cpf', 'email', 'phone', 'document']) AS raw_payload_safe
FROM public.kirvano_webhook_logs;