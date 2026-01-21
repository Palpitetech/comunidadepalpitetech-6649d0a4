-- Adicionar colunas de integração Asaas
ALTER TABLE public.perfis 
ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT,
ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS status_assinatura TEXT DEFAULT 'inativa',
ADD COLUMN IF NOT EXISTS validade_assinatura TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cpf TEXT;

-- Índices para performance em buscas
CREATE INDEX IF NOT EXISTS idx_perfis_asaas_customer 
ON public.perfis(asaas_customer_id);

CREATE INDEX IF NOT EXISTS idx_perfis_status_assinatura 
ON public.perfis(status_assinatura);

-- Documentação
COMMENT ON COLUMN public.perfis.asaas_customer_id IS 'ID do cliente no Asaas (cus_xxx)';
COMMENT ON COLUMN public.perfis.asaas_subscription_id IS 'ID da assinatura no Asaas (sub_xxx)';
COMMENT ON COLUMN public.perfis.status_assinatura IS 'Status: ativa, cancelada, inadimplente, inativa';
COMMENT ON COLUMN public.perfis.validade_assinatura IS 'Data de expiração do acesso premium';
COMMENT ON COLUMN public.perfis.cpf IS 'CPF do cliente (para cobrança)';