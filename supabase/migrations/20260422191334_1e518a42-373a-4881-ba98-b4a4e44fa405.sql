-- Renomear source -> slug
ALTER TABLE public.leads_inbox RENAME COLUMN source TO slug;

-- Adicionar colunas de atribuição completa
ALTER TABLE public.leads_inbox
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS referrer text,
  ADD COLUMN IF NOT EXISTS gclid text,
  ADD COLUMN IF NOT EXISTS fbclid text;

-- Índices parciais para filtros futuros
CREATE INDEX IF NOT EXISTS idx_leads_inbox_slug
  ON public.leads_inbox (slug)
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_inbox_utm_campaign
  ON public.leads_inbox (utm_campaign)
  WHERE utm_campaign IS NOT NULL;