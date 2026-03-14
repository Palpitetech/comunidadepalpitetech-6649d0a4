
CREATE OR REPLACE FUNCTION public.trigger_push_novo_resultado_lotofacil()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  supabase_url text;
  anon_key text;
  webhook_secret text;
  concurso_num text;
BEGIN
  concurso_num := NEW.concurso_id::text;

  SELECT notifications_webhook_secret INTO webhook_secret
  FROM public.admin_settings
  WHERE id = 'default';

  IF webhook_secret IS NULL OR webhook_secret = '' THEN
    RAISE WARNING 'notifications_webhook_secret não configurado em admin_settings';
    RETURN NEW;
  END IF;

  supabase_url := 'https://vevuduwmzoucjaqqdfzw.supabase.co';
  anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldnVkdXdtem91Y2phcXFkZnp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MjkyNzMsImV4cCI6MjA4NDUwNTI3M30.bMYRddIQQ3Y2AY9AbH2jfPvUTPrYBjEZdB2dpiLtbh4';

  PERFORM extensions.http((
    'POST',
    supabase_url || '/functions/v1/send-push',
    ARRAY[
      extensions.http_header('Authorization', 'Bearer ' || anon_key),
      extensions.http_header('apikey', anon_key),
      extensions.http_header('x-webhook-secret', webhook_secret)
    ],
    'application/json',
    jsonb_build_object(
      'tipo', 'resultado_novo',
      'titulo', '🍀 Lotofácil — Concurso ' || concurso_num,
      'mensagem', 'O resultado do concurso ' || concurso_num || ' já está disponível!',
      'loteria', 'lotofacil',
      'concurso_id', NEW.concurso_id
    )::text
  )::extensions.http_request);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao chamar send-push para resultado lotofacil: %', SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_push_resultado_lotofacil
AFTER INSERT ON public.resultados
FOR EACH ROW
EXECUTE FUNCTION public.trigger_push_novo_resultado_lotofacil();
