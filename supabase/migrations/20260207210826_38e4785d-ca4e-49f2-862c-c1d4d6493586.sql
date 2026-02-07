-- Criar tabela de pastas para organizar palpites
CREATE TABLE public.palpites_pastas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#8b5cf6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar colunas à tabela palpites_salvos
ALTER TABLE public.palpites_salvos 
ADD COLUMN pasta_id UUID REFERENCES public.palpites_pastas(id) ON DELETE SET NULL,
ADD COLUMN estrategia TEXT;

-- Enable RLS
ALTER TABLE public.palpites_pastas ENABLE ROW LEVEL SECURITY;

-- Policies para pastas
CREATE POLICY "Users can view their own folders"
ON public.palpites_pastas FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders"
ON public.palpites_pastas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
ON public.palpites_pastas FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
ON public.palpites_pastas FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_palpites_pastas_updated_at
BEFORE UPDATE ON public.palpites_pastas
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Índices
CREATE INDEX idx_palpites_salvos_pasta_id ON public.palpites_salvos(pasta_id);
CREATE INDEX idx_palpites_pastas_user_id ON public.palpites_pastas(user_id);