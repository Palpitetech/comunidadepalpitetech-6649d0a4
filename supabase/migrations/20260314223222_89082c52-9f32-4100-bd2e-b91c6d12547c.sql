ALTER TABLE public.boloes ADD COLUMN IF NOT EXISTS resultado_verificado boolean DEFAULT false;
ALTER TABLE public.boloes ADD COLUMN IF NOT EXISTS verificado_em timestamptz;
ALTER TABLE public.boloes ADD COLUMN IF NOT EXISTS palpites_premiados jsonb DEFAULT '[]';