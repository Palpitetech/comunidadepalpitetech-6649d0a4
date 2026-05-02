-- =============================================================
-- ETAPA 1: Refatoração do Sistema de Campanhas
-- =============================================================

DO $$ BEGIN
  CREATE TYPE campaign_type AS ENUM ('transacional','recuperacao','ltv','publico');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE campaign_trigger_type AS ENUM ('evento','tag','publico','ltv');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tag_match_operator AS ENUM ('any','all','none','not');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE message_queue
  DROP CONSTRAINT IF EXISTS message_queue_status_check;

ALTER TABLE message_queue
  ADD CONSTRAINT message_queue_status_check
  CHECK (status IN ('waiting', 'pending', 'sending', 'sent', 'error', 'failed', 'cancelled'));

CREATE TABLE IF NOT EXISTS campaigns (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  description           text,
  type                  campaign_type NOT NULL,
  trigger_type          campaign_trigger_type NOT NULL,
  product_id            uuid,
  delay_enabled         boolean NOT NULL DEFAULT false,
  delay_minutes         integer CHECK (delay_minutes >= 0),
  is_active             boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  legacy_template_id    uuid REFERENCES message_templates(id) ON DELETE SET NULL
);

COMMENT ON TABLE campaigns IS 'Entidade principal de comunicação. Substitui message_templates.';
COMMENT ON COLUMN campaigns.delay_minutes IS 'Delay sempre em minutos. UI converte: 60=1h, 1440=1d, 10080=7d.';
COMMENT ON COLUMN campaigns.legacy_template_id IS 'Referência temporária ao registro antigo em message_templates.';

CREATE TABLE IF NOT EXISTS campaign_triggers (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id           uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  event_type            text,
  ltv_days              integer CHECK (ltv_days > 0),
  include_tags          text[],
  exclude_tags          text[],
  tag_operator          tag_match_operator DEFAULT 'any',
  audience_event_type   text,
  audience_window_days  integer,
  audience_include_tags text[],
  audience_exclude_tags text[],
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id)
);

COMMENT ON TABLE campaign_triggers IS 'Define o gatilho de cada campanha. Exatamente 1 registro por campanha.';

CREATE TABLE IF NOT EXISTS campaign_cancel_rules (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id           uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  label                 text NOT NULL DEFAULT 'Regra de cancelamento',
  cancel_on_event       text,
  cancel_on_tag_added   text,
  cancel_on_tag_removed text,
  cancel_on_any_purchase boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cancel_rule_has_condition CHECK (
    cancel_on_event IS NOT NULL
    OR cancel_on_tag_added IS NOT NULL
    OR cancel_on_tag_removed IS NOT NULL
    OR cancel_on_any_purchase = true
  )
);

COMMENT ON TABLE campaign_cancel_rules IS 'Regras que cancelam um item em status waiting na message_queue.';

CREATE TABLE IF NOT EXISTS campaign_variants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  content       text NOT NULL,
  position      integer NOT NULL DEFAULT 1,
  is_active     boolean NOT NULL DEFAULT true,
  times_used    integer NOT NULL DEFAULT 0,
  last_used_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, position)
);

COMMENT ON TABLE campaign_variants IS 'Variantes de mensagem para rotação anti-bloqueio.';

ALTER TABLE message_queue
  ADD COLUMN IF NOT EXISTS campaign_id         uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS campaign_variant_id uuid REFERENCES campaign_variants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancelled_at        timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_reason       text,
  ADD COLUMN IF NOT EXISTS lead_id             uuid REFERENCES perfis(id) ON DELETE SET NULL;

COMMENT ON COLUMN message_queue.cancel_reason IS 'Formato: event:<type> | tag_added:<tag> | tag_removed:<tag> | any_purchase';

CREATE INDEX IF NOT EXISTS idx_queue_campaign_waiting
  ON message_queue (campaign_id, status) WHERE status = 'waiting';
CREATE INDEX IF NOT EXISTS idx_queue_pending_scheduled
  ON message_queue (scheduled_at, status) WHERE status IN ('pending', 'waiting');
CREATE INDEX IF NOT EXISTS idx_campaign_triggers_event
  ON campaign_triggers (event_type) WHERE event_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaigns_type_active
  ON campaigns (type, is_active) WHERE is_active = true;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER campaign_variants_updated_at
  BEFORE UPDATE ON campaign_variants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- MIGRAÇÃO de dados existentes
INSERT INTO campaigns (
  name, type, trigger_type,
  delay_enabled, delay_minutes,
  is_active, legacy_template_id,
  created_at, updated_at
)
SELECT
  name,
  CASE
    WHEN category = 'utility'   THEN 'transacional'::campaign_type
    WHEN category = 'marketing' THEN 'recuperacao'::campaign_type
    ELSE                             'transacional'::campaign_type
  END,
  CASE
    WHEN event_trigger = 'manual' THEN 'publico'::campaign_trigger_type
    ELSE                               'evento'::campaign_trigger_type
  END,
  delay_enabled,
  NULLIF(delay_minutes, 0),
  is_active,
  id,
  created_at,
  created_at
FROM message_templates;

INSERT INTO campaign_triggers (
  campaign_id, event_type,
  include_tags, exclude_tags, tag_operator
)
SELECT
  c.id,
  CASE WHEN mt.event_trigger <> 'manual' THEN mt.event_trigger ELSE NULL END,
  mt.include_tags,
  mt.exclude_tags,
  CASE
    WHEN mt.tags_match_mode = 'all' THEN 'all'::tag_match_operator
    ELSE 'any'::tag_match_operator
  END
FROM campaigns c
JOIN message_templates mt ON mt.id = c.legacy_template_id;

INSERT INTO campaign_variants (
  campaign_id, content, position,
  is_active, times_used, last_used_at,
  created_at, updated_at
)
SELECT
  c.id,
  v.content, v.position,
  v.is_active, v.times_used, v.last_used_at,
  v.created_at, v.updated_at
FROM message_template_variants v
JOIN message_templates mt ON mt.id = v.template_id
JOIN campaigns c ON c.legacy_template_id = mt.id;

-- RLS
ALTER TABLE campaigns             ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_triggers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_cancel_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_variants     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_admin" ON campaigns
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "campaign_triggers_admin" ON campaign_triggers
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "campaign_cancel_rules_admin" ON campaign_cancel_rules
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "campaign_variants_admin" ON campaign_variants
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "campaigns_service_role" ON campaigns
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "campaign_triggers_service_role" ON campaign_triggers
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "campaign_cancel_rules_service_role" ON campaign_cancel_rules
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "campaign_variants_service_role" ON campaign_variants
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');