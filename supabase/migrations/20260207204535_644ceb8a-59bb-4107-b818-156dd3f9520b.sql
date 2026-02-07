-- Tabela para salvar palpites gerados
CREATE TABLE public.palpites_salvos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dezenas INTEGER[] NOT NULL,
  qtd_dezenas INTEGER NOT NULL DEFAULT 15,
  periodo_analise INTEGER DEFAULT 50,
  loteria VARCHAR DEFAULT 'lotofacil',
  nome TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  concurso_alvo INTEGER,
  conferido BOOLEAN NOT NULL DEFAULT false,
  acertos INTEGER
);

-- Índices para performance
CREATE INDEX idx_palpites_salvos_user_id ON public.palpites_salvos(user_id);
CREATE INDEX idx_palpites_salvos_created_at ON public.palpites_salvos(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.palpites_salvos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuarios podem ver seus proprios palpites"
  ON public.palpites_salvos
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios podem criar seus proprios palpites"
  ON public.palpites_salvos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios podem atualizar seus proprios palpites"
  ON public.palpites_salvos
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios podem deletar seus proprios palpites"
  ON public.palpites_salvos
  FOR DELETE
  USING (auth.uid() = user_id);