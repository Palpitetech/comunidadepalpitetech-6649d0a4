ALTER TABLE public.whatsapp_smart_links 
ADD COLUMN plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
ADD COLUMN redirect_type TEXT DEFAULT 'whatsapp' CHECK (redirect_type IN ('whatsapp', 'checkout'));

COMMENT ON COLUMN public.whatsapp_smart_links.plan_id IS 'ID do plano (produto) para redirecionamento via checkout';
COMMENT ON COLUMN public.whatsapp_smart_links.redirect_type IS 'Tipo de redirecionamento: whatsapp (padrão) ou checkout (Kirvano)';