-- Attach the existing trigger_bot_post_interactions() to postagens table
-- Only fires when a bot creates a post (checks perfis.is_bot)
CREATE OR REPLACE FUNCTION public.trigger_bot_post_interactions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  is_author_bot boolean;
  supabase_url text;
  anon_key text;
BEGIN
  -- Only trigger for bot-authored posts
  SELECT is_bot INTO is_author_bot
  FROM public.perfis
  WHERE id = NEW.user_id;

  IF is_author_bot IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  supabase_url := 'https://vevuduwmzoucjaqqdfzw.supabase.co';
  anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldnVkdXdtem91Y2phcXFkZnp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MjkyNzMsImV4cCI6MjA4NDUwNTI3M30.bMYRddIQQ3Y2AY9AbH2jfPvUTPrYBjEZdB2dpiLtbh4';

  PERFORM extensions.http((
    'POST',
    supabase_url || '/functions/v1/bot-interact-with-post',
    ARRAY[
      extensions.http_header('Authorization', 'Bearer ' || anon_key),
      extensions.http_header('apikey', anon_key)
    ],
    'application/json',
    jsonb_build_object('post_id', NEW.id)::text
  )::extensions.http_request);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao chamar bot-interact-with-post: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Create the trigger on postagens table (AFTER INSERT)
CREATE TRIGGER trigger_bot_post_interactions
  AFTER INSERT ON public.postagens
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_bot_post_interactions();