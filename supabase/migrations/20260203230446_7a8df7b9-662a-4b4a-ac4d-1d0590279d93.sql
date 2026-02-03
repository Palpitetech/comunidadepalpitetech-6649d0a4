-- Criar tabela de controle de uso diário do gerador
CREATE TABLE public.gerador_daily_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  day date NOT NULL DEFAULT CURRENT_DATE,
  count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT gerador_daily_usage_user_day_unique UNIQUE (user_id, day)
);

-- Enable RLS
ALTER TABLE public.gerador_daily_usage ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own gerador_daily_usage"
ON public.gerador_daily_usage
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage gerador_daily_usage"
ON public.gerador_daily_usage
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Trigger para updated_at
CREATE TRIGGER update_gerador_daily_usage_updated_at
BEFORE UPDATE ON public.gerador_daily_usage
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Adicionar coluna gerador_max_per_day na tabela plans
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS gerador_max_per_day integer NOT NULL DEFAULT 0;