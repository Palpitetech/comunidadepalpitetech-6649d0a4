
-- Corrigir trigger_bot_post_interactions para usar extensions.http() com tipo correto
CREATE OR REPLACE FUNCTION public.trigger_bot_post_interactions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  supabase_url text;
  anon_key text;
BEGIN
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
$$;

-- Corrigir trigger_bot_reply para usar extensions.http() com tipo correto
CREATE OR REPLACE FUNCTION public.trigger_bot_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_author_bot boolean;
  supabase_url text;
  anon_key text;
BEGIN
  SELECT is_bot INTO is_author_bot
  FROM public.perfis
  WHERE id = NEW.user_id;
  
  IF is_author_bot = true THEN
    RETURN NEW;
  END IF;
  
  supabase_url := 'https://vevuduwmzoucjaqqdfzw.supabase.co';
  anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldnVkdXdtem91Y2phcXFkZnp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MjkyNzMsImV4cCI6MjA4NDUwNTI3M30.bMYRddIQQ3Y2AY9AbH2jfPvUTPrYBjEZdB2dpiLtbh4';
  
  PERFORM extensions.http((
    'POST',
    supabase_url || '/functions/v1/bot-reply-user',
    ARRAY[
      extensions.http_header('Authorization', 'Bearer ' || anon_key),
      extensions.http_header('apikey', anon_key)
    ],
    'application/json',
    jsonb_build_object(
      'comment_id', NEW.id,
      'post_id', NEW.post_id,
      'user_id', NEW.user_id,
      'conteudo', NEW.conteudo
    )::text
  )::extensions.http_request);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao chamar bot-reply-user: %', SQLERRM;
    RETURN NEW;
END;
$$;
