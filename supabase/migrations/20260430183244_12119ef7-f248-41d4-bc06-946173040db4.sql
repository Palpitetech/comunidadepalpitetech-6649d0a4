CREATE OR REPLACE FUNCTION public.increment_unread_count(p_phone_number text)
RETURNS void AS $$
BEGIN
  UPDATE public.whatsapp_chat_conversations
  SET unread_count = unread_count + 1
  WHERE phone_number = p_phone_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;