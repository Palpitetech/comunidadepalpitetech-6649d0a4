-- Tabela para rastrear uso do auto-preenchimento
CREATE TABLE public.fechamento_auto_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, day)
);

-- Habilitar RLS
ALTER TABLE public.fechamento_auto_usage ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own usage"
  ON public.fechamento_auto_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON public.fechamento_auto_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON public.fechamento_auto_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER handle_fechamento_auto_usage_updated_at
  BEFORE UPDATE ON public.fechamento_auto_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();