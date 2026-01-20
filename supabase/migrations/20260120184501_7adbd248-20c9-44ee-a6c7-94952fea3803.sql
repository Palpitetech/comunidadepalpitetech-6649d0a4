-- Adicionar coluna email_verificado na tabela perfis (caso não exista)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'perfis' 
    AND column_name = 'email_verificado'
  ) THEN
    ALTER TABLE public.perfis ADD COLUMN email_verificado BOOLEAN DEFAULT FALSE;
  END IF;
END $$;