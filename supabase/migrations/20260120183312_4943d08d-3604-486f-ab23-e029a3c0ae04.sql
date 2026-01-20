-- Tabela para armazenar códigos de verificação OTP
CREATE TABLE public.codigos_verificacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  codigo VARCHAR(6) NOT NULL,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('sms', 'email')),
  destino TEXT NOT NULL,
  expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
  usado BOOLEAN DEFAULT FALSE,
  tentativas INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Índices para performance
CREATE INDEX idx_codigos_user_id ON public.codigos_verificacao(user_id);
CREATE INDEX idx_codigos_expira_em ON public.codigos_verificacao(expira_em);

-- Habilitar RLS
ALTER TABLE public.codigos_verificacao ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver seus próprios códigos
CREATE POLICY "Usuarios podem ver seus proprios codigos"
  ON public.codigos_verificacao
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: service role pode gerenciar todos os códigos (para edge functions)
CREATE POLICY "Service role pode inserir codigos"
  ON public.codigos_verificacao
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role pode atualizar codigos"
  ON public.codigos_verificacao
  FOR UPDATE
  USING (true);