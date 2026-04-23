-- Singleton table to control global app version / force reload
CREATE TABLE public.app_config (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  current_version BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM now())::BIGINT,
  force_reload_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Public can read (everyone needs to check version)
CREATE POLICY "app_config_select_public"
ON public.app_config
FOR SELECT
USING (true);

-- Only admins can update
CREATE POLICY "app_config_update_admin"
ON public.app_config
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger to keep updated_at fresh
CREATE TRIGGER update_app_config_updated_at
BEFORE UPDATE ON public.app_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed single row
INSERT INTO public.app_config (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Enable realtime
ALTER TABLE public.app_config REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_config;