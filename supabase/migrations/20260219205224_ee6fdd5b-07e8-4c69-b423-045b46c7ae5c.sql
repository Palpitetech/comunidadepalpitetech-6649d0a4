
-- Criar plano Semestral
INSERT INTO public.plans (name, slug, price, display_order, is_active, gerador_max_per_day, chat_estatisticas_max_msgs_per_day, features)
VALUES (
  'Semestral', 'semestral', 67, 2, true, 20, 10,
  '{"ciclos": true, "comunidade_full": true, "estatisticas": true, "gerador": true, "guias": true, "notificacoes_email": true, "notificacoes_push": true, "notificacoes_sms": true, "quentes_frias": true}'::jsonb
);

-- Criar plano Anual
INSERT INTO public.plans (name, slug, price, display_order, is_active, gerador_max_per_day, chat_estatisticas_max_msgs_per_day, features)
VALUES (
  'Anual', 'anual', 97, 3, true, 30, 20,
  '{"ciclos": true, "comunidade_full": true, "estatisticas": true, "gerador": true, "guias": true, "notificacoes_email": true, "notificacoes_push": true, "notificacoes_sms": true, "quentes_frias": true}'::jsonb
);
