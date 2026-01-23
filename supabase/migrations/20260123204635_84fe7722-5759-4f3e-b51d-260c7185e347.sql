-- 1) Global CTA settings (single active row pattern)
CREATE TABLE IF NOT EXISTS public.ai_cta_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT true,
  default_text text NOT NULL DEFAULT '',
  max_buttons integer NOT NULL DEFAULT 3,
  buttons jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.ai_cta_settings ENABLE ROW LEVEL SECURITY;

-- Admin-only management
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ai_cta_settings'
      AND policyname = 'Admins podem gerenciar ai_cta_settings'
  ) THEN
    CREATE POLICY "Admins podem gerenciar ai_cta_settings"
    ON public.ai_cta_settings
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'::public.app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END $$;

-- Timestamp trigger (reuse existing function)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_ai_cta_settings_updated_at'
  ) THEN
    CREATE TRIGGER trg_ai_cta_settings_updated_at
    BEFORE UPDATE ON public.ai_cta_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- Seed default row if empty
INSERT INTO public.ai_cta_settings (enabled, default_text, max_buttons, buttons)
SELECT true,
       'Adquira a cota do seu bolão clicando no chat pelo menu inferior e clicando em "Quero conhecer os Bolões".',
       3,
       jsonb_build_array(
         jsonb_build_object(
           'label', 'Quero conhecer os Bolões',
           'type', 'open_chat_topic',
           'payload', jsonb_build_object('topicId','boloess','autoSendStarter', true)
         )
       )
WHERE NOT EXISTS (SELECT 1 FROM public.ai_cta_settings);


-- 2) Per-bot overrides
ALTER TABLE public.guide_personas
  ADD COLUMN IF NOT EXISTS cta_override_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cta_override_text text NULL,
  ADD COLUMN IF NOT EXISTS cta_override_buttons jsonb NOT NULL DEFAULT '[]'::jsonb;


-- 3) Actions blobs on content tables
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS actions jsonb NULL;

ALTER TABLE public.postagens
  ADD COLUMN IF NOT EXISTS actions jsonb NULL;

ALTER TABLE public.post_comments
  ADD COLUMN IF NOT EXISTS actions jsonb NULL;
