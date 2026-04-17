-- Remover job anterior se existir para evitar duplicidade
SELECT cron.unschedule('handle-subscription-expiration-daily') 
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'handle-subscription-expiration-daily');

-- Agendar a verificação de expiração para as 03:00 AM todos os dias
SELECT cron.schedule(
  'handle-subscription-expiration-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vevuduwmzoucjaqqdfzw.supabase.co/functions/v1/handle-subscription-expiration',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);