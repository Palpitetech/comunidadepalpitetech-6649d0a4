-- Tabela de Conversas
CREATE TABLE public.whatsapp_chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL UNIQUE,
  profile_name text,
  last_message_at timestamptz,
  last_message_preview text,
  unread_count int NOT NULL DEFAULT 0,
  instance_id uuid REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.whatsapp_chat_conversations ENABLE ROW LEVEL SECURITY;

-- Políticas Conversations
CREATE POLICY "Admins acesso total conversations"
  ON public.whatsapp_chat_conversations FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role acesso total conversations"
  ON public.whatsapp_chat_conversations FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Tabela de Mensagens
CREATE TABLE public.whatsapp_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.whatsapp_chat_conversations(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  instance_id uuid REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content text NOT NULL,
  evolution_message_id text,
  status text NOT NULL DEFAULT 'received',
  received_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '48 hours'
);

ALTER TABLE public.whatsapp_chat_messages ENABLE ROW LEVEL SECURITY;

-- Índices Mensagens
CREATE INDEX idx_chat_messages_expires ON public.whatsapp_chat_messages(expires_at);
CREATE INDEX idx_chat_messages_conversation ON public.whatsapp_chat_messages(conversation_id, received_at DESC);
CREATE INDEX idx_chat_messages_phone ON public.whatsapp_chat_messages(phone_number);

-- Políticas Mensagens
CREATE POLICY "Admins acesso total messages"
  ON public.whatsapp_chat_messages FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role acesso total messages"
  ON public.whatsapp_chat_messages FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Limpeza automática via pg_cron (se disponível)
-- Nota: Caso pg_cron não esteja habilitado, a query falhará mas as tabelas permanecerão.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'cleanup-chat-messages',
      '0 * * * *',
      'DELETE FROM public.whatsapp_chat_messages WHERE expires_at < now()'
    );
  END IF;
END $$;

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_chat_messages;