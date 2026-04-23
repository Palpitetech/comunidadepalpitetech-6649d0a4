-- =========================================================================
-- 1. REATRIBUIR POSTS AO AUGUSTO ANGELIS
-- =========================================================================
DO $$
DECLARE
  AUGUSTO_ID uuid := '41b58d48-2ef1-4bf7-a536-ed8a49607fa9';
BEGIN
  -- Reatribui posts dos outros bots ao Augusto
  UPDATE public.postagens
  SET user_id = AUGUSTO_ID
  WHERE user_id IN (
    SELECT id FROM public.perfis WHERE is_bot = true AND id <> AUGUSTO_ID
  );

  -- Reatribui comentários (caso bots tenham comentado) ao Augusto
  UPDATE public.post_comments
  SET user_id = AUGUSTO_ID
  WHERE user_id IN (
    SELECT id FROM public.perfis WHERE is_bot = true AND id <> AUGUSTO_ID
  );

  -- Define logo Palpite Tech como avatar do Augusto
  UPDATE public.perfis
  SET avatar_url = '/logo.png',
      nome = 'Augusto Angelis'
  WHERE id = AUGUSTO_ID;
END $$;

-- =========================================================================
-- 2. REMOVER TRIGGERS E FUNÇÕES DE BOT
-- =========================================================================
DROP TRIGGER IF EXISTS on_comment_insert_trigger_bot ON public.post_comments;
DROP TRIGGER IF EXISTS postagens_trigger_bot_interactions ON public.postagens;
DROP TRIGGER IF EXISTS trigger_bot_post_interactions ON public.postagens;

DROP FUNCTION IF EXISTS public.trigger_bot_reply() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_bot_post_interactions() CASCADE;

-- =========================================================================
-- 3. DROP DE VIEWS E TABELAS DE BOTS / CHAT
-- =========================================================================
DROP VIEW IF EXISTS public.guide_personas_publico CASCADE;

DROP TABLE IF EXISTS public.bot_publishing_logs CASCADE;
DROP TABLE IF EXISTS public.bot_post_interactions CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_conversations CASCADE;
DROP TABLE IF EXISTS public.chat_daily_usage CASCADE;
DROP TABLE IF EXISTS public.guide_personas CASCADE;

-- =========================================================================
-- 4. DELETAR PERFIS-BOT EXTRAS (mantém apenas Augusto Angelis)
-- =========================================================================
DELETE FROM public.perfis
WHERE is_bot = true
  AND id <> '41b58d48-2ef1-4bf7-a536-ed8a49607fa9';

-- =========================================================================
-- 5. NOVA TABELA: post_schedules (substitui guide_personas)
-- =========================================================================
CREATE TABLE public.post_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_post text NOT NULL,
  horario text NOT NULL,                                  -- formato "HH:MM"
  dias int[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
  ativo boolean NOT NULL DEFAULT true,
  loteria text NOT NULL DEFAULT 'lotofacil',
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tipo_post, horario, loteria)
);

CREATE INDEX idx_post_schedules_ativo ON public.post_schedules(ativo) WHERE ativo = true;
CREATE INDEX idx_post_schedules_horario ON public.post_schedules(horario);

ALTER TABLE public.post_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam post_schedules"
ON public.post_schedules FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role acesso total post_schedules"
ON public.post_schedules FOR ALL TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_post_schedules_updated_at
BEFORE UPDATE ON public.post_schedules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- 6. SEED dos 6 horários diários da Lotofácil
-- (slot 23h fica fora — disparado pelo sync-lotofacil)
-- =========================================================================
INSERT INTO public.post_schedules (tipo_post, horario, dias, loteria, observacao) VALUES
  ('analise_ciclo',         '08:00', '{0,1,2,3,4,5,6}', 'lotofacil', 'Status do ciclo + dezenas faltantes'),
  ('analise_movimentacao',  '09:00', '{0,1,2,3,4,5,6}', 'lotofacil', 'Quentes/Frias + Fixas/Excluídas'),
  ('analise_moldura',       '10:00', '{0,1,2,3,4,5,6}', 'lotofacil', 'Dezenas e quantidade ideal de moldura'),
  ('analise_repetidas',     '11:00', '{0,1,2,3,4,5,6}', 'lotofacil', 'Quais repetir e quantas'),
  ('analise_linhas',        '12:00', '{0,1,2,3,4,5,6}', 'lotofacil', 'Comportamento + montagem por linha'),
  ('analise_colunas',       '13:00', '{0,1,2,3,4,5,6}', 'lotofacil', 'Comportamento + montagem por coluna');

-- =========================================================================
-- 7. AJUSTAR ai_usage_logs (manter coluna mas tornar opcional/sem FK)
-- A FK já não existe (guide_personas foi dropada com CASCADE)
-- bot_persona_id agora é apenas histórico, não referencia mais nada
-- =========================================================================
COMMENT ON COLUMN public.ai_usage_logs.bot_persona_id IS 'Histórico apenas. Tabela guide_personas foi removida.';
COMMENT ON COLUMN public.ai_usage_logs.bot_name IS 'Histórico apenas. Mantido para auditoria de logs antigos.';