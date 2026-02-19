
-- 1. Habilitar extensão http para que triggers possam chamar Edge Functions
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- 2. Criar função process_pending_bot_replies (chamada pelo cron job 6)
-- Esta função é um no-op seguro já que as respostas são processadas via trigger em tempo real
CREATE OR REPLACE FUNCTION public.process_pending_bot_replies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- As respostas de bot são processadas em tempo real pelo trigger trigger_bot_reply
  -- Esta função existe para evitar erros no cron job
  NULL;
END;
$$;
