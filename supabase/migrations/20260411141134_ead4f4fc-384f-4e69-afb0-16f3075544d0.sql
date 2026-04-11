-- Add trial_used to perfis
ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT FALSE;

-- Create Trial Plan
INSERT INTO public.plans (
  id,
  name,
  slug,
  price,
  is_active,
  display_order,
  description,
  gerador_max_per_day,
  chat_estatisticas_max_msgs_per_day,
  features
) VALUES (
  'b3a2a9e3-8e3b-4e3b-8e3b-8e3b8e3b8e3b',
  'Teste Grátis (3 Dias)',
  'trial-3-dias',
  0,
  true,
  -1,
  'Acesso total e ilimitado a todas as ferramentas por 3 dias',
  100,
  100,
  '{
    "analise_do_dia": true,
    "chat_acesso_ferramentas": true,
    "chat_boloes": true,
    "chat_duvidas_comunidade": true,
    "chat_duvidas_ferramentas": true,
    "chat_estatisticas": true,
    "ciclos": true,
    "comunidade_full": true,
    "desdobramento": true,
    "dezenas_por_posicao": true,
    "estatisticas": true,
    "fechamento": true,
    "frequencia_dezenas": true,
    "gerador": true,
    "guias": true,
    "linhas_colunas": true,
    "notificacoes_email": true,
    "notificacoes_push": true,
    "notificacoes_sms": true,
    "palpites_salvos": true,
    "quentes_frias": true,
    "tabela_movimentacao": true,
    "tendencias": true
  }'::jsonb
) ON CONFLICT (slug) DO UPDATE SET 
  features = EXCLUDED.features,
  price = EXCLUDED.price,
  name = EXCLUDED.name,
  description = EXCLUDED.description;
