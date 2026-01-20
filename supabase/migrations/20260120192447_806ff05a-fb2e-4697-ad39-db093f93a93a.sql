-- Cria fila interna de notificações pendentes (processamento via função backend)

CREATE TABLE IF NOT EXISTS public.notificacoes_pendentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  payload jsonb NOT NULL,
  chave_dedup text,
  processado boolean NOT NULL DEFAULT false,
  processado_em timestamptz,
  erro text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Idempotência opcional (ex.: comunidade:YYYY-MM-DD)
CREATE UNIQUE INDEX IF NOT EXISTS notificacoes_pendentes_chave_dedup_uidx
  ON public.notificacoes_pendentes (chave_dedup)
  WHERE chave_dedup IS NOT NULL;

-- Busca rápida por pendências
CREATE INDEX IF NOT EXISTS notificacoes_pendentes_pendentes_idx
  ON public.notificacoes_pendentes (processado, created_at);

-- RLS: uso interno somente
ALTER TABLE public.notificacoes_pendentes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- SELECT apenas service_role
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notificacoes_pendentes'
      AND policyname = 'Service role pode ler fila de notificacoes'
  ) THEN
    CREATE POLICY "Service role pode ler fila de notificacoes"
    ON public.notificacoes_pendentes
    FOR SELECT
    USING (auth.role() = 'service_role'::text);
  END IF;

  -- INSERT apenas service_role
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notificacoes_pendentes'
      AND policyname = 'Service role pode inserir fila de notificacoes'
  ) THEN
    CREATE POLICY "Service role pode inserir fila de notificacoes"
    ON public.notificacoes_pendentes
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role'::text);
  END IF;

  -- UPDATE apenas service_role
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notificacoes_pendentes'
      AND policyname = 'Service role pode atualizar fila de notificacoes'
  ) THEN
    CREATE POLICY "Service role pode atualizar fila de notificacoes"
    ON public.notificacoes_pendentes
    FOR UPDATE
    USING (auth.role() = 'service_role'::text)
    WITH CHECK (auth.role() = 'service_role'::text);
  END IF;
END $$;