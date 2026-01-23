-- 1) Colunas de controle por post (limite por post + variabilidade)
ALTER TABLE public.postagens
ADD COLUMN IF NOT EXISTS bot_interactions_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS bot_interactions_target integer NULL,
ADD COLUMN IF NOT EXISTS bot_interactions_done integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS bot_interactions_last_at timestamp with time zone NULL;

-- 2) Config por bot: permitir comentar em posts novos + limite por post
ALTER TABLE public.guide_personas
ADD COLUMN IF NOT EXISTS can_comment_on_posts boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS max_comments_per_post integer NOT NULL DEFAULT 1;

-- 3) Auditoria/Idempotência das interações
CREATE TABLE IF NOT EXISTS public.bot_post_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  bot_perfil_id uuid NOT NULL,
  comment_id uuid NULL,
  status text NOT NULL DEFAULT 'queued',
  reason text NULL,
  error text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Unicidade: um bot só comenta 1x automaticamente por post
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bot_post_interactions_unique_post_bot'
  ) THEN
    ALTER TABLE public.bot_post_interactions
    ADD CONSTRAINT bot_post_interactions_unique_post_bot UNIQUE (post_id, bot_perfil_id);
  END IF;
END $$;

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_bot_post_interactions_post_id ON public.bot_post_interactions(post_id);
CREATE INDEX IF NOT EXISTS idx_bot_post_interactions_status ON public.bot_post_interactions(status);

-- FK (sem cascade para evitar efeitos colaterais)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bot_post_interactions_post_fk'
  ) THEN
    ALTER TABLE public.bot_post_interactions
    ADD CONSTRAINT bot_post_interactions_post_fk FOREIGN KEY (post_id) REFERENCES public.postagens(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bot_post_interactions_bot_fk'
  ) THEN
    ALTER TABLE public.bot_post_interactions
    ADD CONSTRAINT bot_post_interactions_bot_fk FOREIGN KEY (bot_perfil_id) REFERENCES public.perfis(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bot_post_interactions_comment_fk'
  ) THEN
    ALTER TABLE public.bot_post_interactions
    ADD CONSTRAINT bot_post_interactions_comment_fk FOREIGN KEY (comment_id) REFERENCES public.post_comments(id);
  END IF;
END $$;

-- updated_at trigger function já existe (handle_updated_at), mas aqui só garantimos trigger
ALTER TABLE public.bot_post_interactions ENABLE ROW LEVEL SECURITY;

-- RLS: admins podem ler; service role escreve
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='bot_post_interactions' AND policyname='Admins podem ler bot_post_interactions') THEN
    CREATE POLICY "Admins podem ler bot_post_interactions"
    ON public.bot_post_interactions
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='bot_post_interactions' AND policyname='Service role pode inserir bot_post_interactions') THEN
    CREATE POLICY "Service role pode inserir bot_post_interactions"
    ON public.bot_post_interactions
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='bot_post_interactions' AND policyname='Service role pode atualizar bot_post_interactions') THEN
    CREATE POLICY "Service role pode atualizar bot_post_interactions"
    ON public.bot_post_interactions
    FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- Trigger para updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'bot_post_interactions_updated_at'
  ) THEN
    CREATE TRIGGER bot_post_interactions_updated_at
    BEFORE UPDATE ON public.bot_post_interactions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- 4) Disparar automação ao criar post: chama backend function bot-interact-with-post
CREATE OR REPLACE FUNCTION public.trigger_bot_post_interactions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  supabase_url text;
BEGIN
  supabase_url := 'https://vevuduwmzoucjaqqdfzw.supabase.co';

  -- Chamada assíncrona (não bloqueia a inserção do post)
  PERFORM extensions.http_post(
    url := supabase_url || '/functions/v1/bot-interact-with-post',
    body := jsonb_build_object('post_id', NEW.id)::text,
    headers := jsonb_build_object('Content-Type', 'application/json')
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao chamar bot-interact-with-post: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Criar trigger (somente em posts raiz)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'postagens_trigger_bot_interactions'
  ) THEN
    CREATE TRIGGER postagens_trigger_bot_interactions
    AFTER INSERT ON public.postagens
    FOR EACH ROW
    WHEN (NEW.parent_id IS NULL)
    EXECUTE FUNCTION public.trigger_bot_post_interactions();
  END IF;
END $$;
