-- 1. Histórico de adição de tags em perfis
CREATE TABLE IF NOT EXISTS public.perfil_tag_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  perfil_id uuid NOT NULL,
  tag text NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_perfil_tag_history_perfil_added 
  ON public.perfil_tag_history (perfil_id, added_at DESC);

CREATE INDEX IF NOT EXISTS idx_perfil_tag_history_tag_added 
  ON public.perfil_tag_history (tag, added_at DESC);

ALTER TABLE public.perfil_tag_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins leem perfil_tag_history"
  ON public.perfil_tag_history FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role gerencia perfil_tag_history"
  ON public.perfil_tag_history FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 2. Trigger que registra cada nova tag adicionada
CREATE OR REPLACE FUNCTION public.log_perfil_tag_additions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tag text;
  old_tags text[];
BEGIN
  old_tags := COALESCE(OLD.tags, ARRAY[]::text[]);
  IF NEW.tags IS NULL THEN
    RETURN NEW;
  END IF;
  FOREACH new_tag IN ARRAY NEW.tags LOOP
    IF NOT (new_tag = ANY(old_tags)) THEN
      INSERT INTO public.perfil_tag_history (perfil_id, tag, added_at)
      VALUES (NEW.id, new_tag, now());
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_perfil_tag_additions ON public.perfis;
CREATE TRIGGER trg_log_perfil_tag_additions
  AFTER INSERT OR UPDATE OF tags ON public.perfis
  FOR EACH ROW
  EXECUTE FUNCTION public.log_perfil_tag_additions();

-- 3. Novas colunas em message_templates
ALTER TABLE public.message_templates 
  ADD COLUMN IF NOT EXISTS exclude_tags_recent text[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE public.message_templates 
  ADD COLUMN IF NOT EXISTS exclude_recent_window_hours integer NOT NULL DEFAULT 24;

-- 4. Nova coluna na tabela de runs (para métrica)
ALTER TABLE public.lead_retargeting_runs
  ADD COLUMN IF NOT EXISTS skipped_recent_purchase integer NOT NULL DEFAULT 0;