-- Adicionar colunas para integração Asaas na tabela plans
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS checkout_link TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.plans.description IS 'Subtítulo do plano para exibição no card de vendas';
COMMENT ON COLUMN public.plans.checkout_link IS 'URL do link de pagamento Asaas/Stripe';