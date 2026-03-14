
CREATE OR REPLACE FUNCTION public.trigger_push_novo_post()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  is_author_bot boolean;
  supabase_url text;
  anon_key text;
  webhook_secret text;
BEGIN
  SELECT is_bot INTO is_author_bot
  FROM public.perfis
  WHERE id = NEW.user_id;

  IF is_author_bot IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  IF NEW.tipo = 'comentario' OR NEW.tipo IS NULL THEN
    RETURN NEW;
  END IF;

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
      'tipo', 'novo_post',
      'titulo', COALESCE(NEW.titulo, 'Nova publicação na comunidade'),
      'mensagem', LEFT(NEW.conteudo, 100),
      'post_id', NEW.id::text,
      'post_slug', COALESCE(NEW.slug, NEW.id::text)
    )::text
  )::extensions.http_request);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao chamar send-push para novo post: %', SQLERRM;
    RETURN NEW;
END;
$function$;
