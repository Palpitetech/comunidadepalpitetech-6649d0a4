-- Habilitar extensão pg_net para chamadas HTTP (se ainda não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Função que dispara a edge function bot-reply-user
CREATE OR REPLACE FUNCTION public.trigger_bot_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_author_bot boolean;
  supabase_url text;
  service_role_key text;
BEGIN
  -- Buscar se o autor é bot
  SELECT is_bot INTO is_author_bot
  FROM public.perfis
  WHERE id = NEW.user_id;
  
  -- Se for bot, não fazer nada (evitar loop infinito)
  IF is_author_bot = true THEN
    RETURN NEW;
  END IF;
  
  -- Buscar URL do Supabase das variáveis de ambiente
  supabase_url := 'https://vevuduwmzoucjaqqdfzw.supabase.co';
  
  -- Chamar a edge function de forma assíncrona
  PERFORM extensions.http_post(
    url := supabase_url || '/functions/v1/bot-reply-user',
    body := jsonb_build_object(
      'comment_id', NEW.id,
      'post_id', NEW.post_id,
      'user_id', NEW.user_id,
      'conteudo', NEW.conteudo
    )::text,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro mas não falha a inserção do comentário
    RAISE WARNING 'Erro ao chamar bot-reply-user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Criar trigger que dispara após inserção de comentário
CREATE TRIGGER on_comment_insert_trigger_bot
AFTER INSERT ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.trigger_bot_reply();

-- Comentário explicativo
COMMENT ON FUNCTION public.trigger_bot_reply() IS 
  'Dispara automaticamente a edge function bot-reply-user quando um usuário real comenta';