-- 1) Tabela de mapeamento instância ↔ grupo
CREATE TABLE public.whatsapp_instance_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  group_jid text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(instance_id, group_jid)
);

CREATE INDEX idx_wig_group_jid ON public.whatsapp_instance_groups(group_jid);
CREATE INDEX idx_wig_instance_id ON public.whatsapp_instance_groups(instance_id);

ALTER TABLE public.whatsapp_instance_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam whatsapp_instance_groups"
  ON public.whatsapp_instance_groups FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Service role acesso whatsapp_instance_groups"
  ON public.whatsapp_instance_groups FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 2) Atualizar RPC select_best_instances para filtrar por p_group_jid
CREATE OR REPLACE FUNCTION public.select_best_instances(
  p_limit integer DEFAULT 5,
  p_group_jid text DEFAULT NULL
)
RETURNS TABLE(instance_id uuid, evolution_instance_id text, phone_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT wi.id, wi.evolution_instance_id, wi.phone_number
  FROM public.whatsapp_instances wi
  WHERE wi.status = 'online'
    AND COALESCE(wi.messages_sent_today, 0) < COALESCE(wi.daily_limit, 100)
    AND (
      wi.last_message_at IS NULL
      OR wi.last_message_at <= now() - (
        COALESCE(
          (wi.cooldown_queue -> (COALESCE(wi.cooldown_queue_index, 0) % NULLIF(jsonb_array_length(wi.cooldown_queue), 0)))::int,
          1
        ) || ' minutes'
      )::interval
    )
    AND (
      p_group_jid IS NULL
      OR EXISTS (
        SELECT 1 FROM public.whatsapp_instance_groups wig
        WHERE wig.instance_id = wi.id AND wig.group_jid = p_group_jid
      )
    )
  ORDER BY wi.last_message_at ASC NULLS FIRST
  LIMIT p_limit;
END;
$$;

-- 3) Trigger 1 — nova instância é mapeada a todos grupos ativos
CREATE OR REPLACE FUNCTION public.auto_map_instance_to_all_groups()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.whatsapp_instance_groups (instance_id, group_jid)
  SELECT NEW.id, g.group_jid
  FROM (
    SELECT DISTINCT unnest(group_jids) AS group_jid
    FROM public.group_blast_configs
    WHERE is_active = true
  ) g
  WHERE g.group_jid IS NOT NULL AND g.group_jid <> ''
  ON CONFLICT (instance_id, group_jid) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_map_instance_to_groups
AFTER INSERT ON public.whatsapp_instances
FOR EACH ROW EXECUTE FUNCTION public.auto_map_instance_to_all_groups();

-- 4) Trigger 2 — grupos novos numa config são mapeados a todas instâncias
CREATE OR REPLACE FUNCTION public.auto_map_all_instances_to_new_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.whatsapp_instance_groups (instance_id, group_jid)
  SELECT wi.id, ng.group_jid
  FROM public.whatsapp_instances wi
  CROSS JOIN (SELECT DISTINCT unnest(NEW.group_jids) AS group_jid) ng
  WHERE ng.group_jid IS NOT NULL AND ng.group_jid <> ''
  ON CONFLICT (instance_id, group_jid) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_map_groups_to_instances
AFTER INSERT OR UPDATE OF group_jids ON public.group_blast_configs
FOR EACH ROW EXECUTE FUNCTION public.auto_map_all_instances_to_new_group();

-- 5) Backfill histórico
INSERT INTO public.whatsapp_instance_groups (instance_id, group_jid)
SELECT wi.id, g.group_jid
FROM public.whatsapp_instances wi
CROSS JOIN (
  SELECT DISTINCT unnest(group_jids) AS group_jid
  FROM public.group_blast_configs
) g
WHERE g.group_jid IS NOT NULL AND g.group_jid <> ''
ON CONFLICT (instance_id, group_jid) DO NOTHING;