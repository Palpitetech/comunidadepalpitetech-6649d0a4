
-- Tabela para armazenar smart links de grupos WhatsApp
CREATE TABLE public.whatsapp_smart_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  group_invite_code TEXT NOT NULL,
  group_name TEXT,
  original_url TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.perfis(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index para busca rápida por slug
CREATE INDEX idx_whatsapp_smart_links_slug ON public.whatsapp_smart_links(slug);

-- Enable RLS
ALTER TABLE public.whatsapp_smart_links ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins full access whatsapp_smart_links"
ON public.whatsapp_smart_links
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Public can read active links (for redirect page)
CREATE POLICY "Public can read active smart links"
ON public.whatsapp_smart_links
FOR SELECT
USING (is_active = true);

-- Service role full access (for incrementing clicks)
CREATE POLICY "Service role full access whatsapp_smart_links"
ON public.whatsapp_smart_links
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
