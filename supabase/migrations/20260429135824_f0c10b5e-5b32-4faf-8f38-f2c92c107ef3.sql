
SELECT cron.schedule(
  'process-email-queue-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://vevuduwmzoucjaqqdfzw.supabase.co/functions/v1/process-email-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldnVkdXdtem91Y2phcXFkZnp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MjkyNzMsImV4cCI6MjA4NDUwNTI3M30.bMYRddIQQ3Y2AY9AbH2jfPvUTPrYBjEZdB2dpiLtbh4'
    ),
    body := jsonb_build_object('source', 'cron')
  );
  $$
);
