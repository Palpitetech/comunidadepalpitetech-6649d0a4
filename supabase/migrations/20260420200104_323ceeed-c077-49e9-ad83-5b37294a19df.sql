ALTER TABLE public.ai_usage_logs
  DROP CONSTRAINT IF EXISTS ai_usage_logs_bot_persona_id_fkey;

ALTER TABLE public.ai_usage_logs
  ADD CONSTRAINT ai_usage_logs_bot_persona_id_fkey
  FOREIGN KEY (bot_persona_id)
  REFERENCES public.guide_personas(id)
  ON DELETE SET NULL;

ALTER TABLE public.bot_publishing_logs
  DROP CONSTRAINT IF EXISTS bot_publishing_logs_guide_persona_id_fkey;

ALTER TABLE public.bot_publishing_logs
  ADD CONSTRAINT bot_publishing_logs_guide_persona_id_fkey
  FOREIGN KEY (guide_persona_id)
  REFERENCES public.guide_personas(id)
  ON DELETE CASCADE;

ALTER TABLE public.chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_bot_persona_id_fkey;

ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_bot_persona_id_fkey
  FOREIGN KEY (bot_persona_id)
  REFERENCES public.guide_personas(id)
  ON DELETE SET NULL;