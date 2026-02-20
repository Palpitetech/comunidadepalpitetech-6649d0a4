
-- Tabela para logs de uso de IA (tokens, custo, etc.)
CREATE TABLE public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Quem gerou
  user_id uuid REFERENCES public.perfis(id),
  bot_persona_id uuid REFERENCES public.guide_personas(id),
  bot_name text,
  
  -- O que gerou
  edge_function text NOT NULL,
  action_type text NOT NULL, -- 'post', 'comment', 'reply', 'chat', 'palpite', 'auto_fill'
  
  -- Tokens
  prompt_tokens integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL DEFAULT 0,
  total_tokens integer NOT NULL DEFAULT 0,
  
  -- Modelo
  model text,
  
  -- Custo estimado em USD
  cost_usd numeric(10, 6) NOT NULL DEFAULT 0,
  
  -- Metadata extra (request details, etc.)
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Índices para consultas frequentes
CREATE INDEX idx_ai_usage_logs_created_at ON public.ai_usage_logs(created_at DESC);
CREATE INDEX idx_ai_usage_logs_edge_function ON public.ai_usage_logs(edge_function);
CREATE INDEX idx_ai_usage_logs_bot_persona ON public.ai_usage_logs(bot_persona_id);
CREATE INDEX idx_ai_usage_logs_user_id ON public.ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_action_type ON public.ai_usage_logs(action_type);

-- RLS
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ler
CREATE POLICY "Admins podem ler ai_usage_logs"
  ON public.ai_usage_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role pode inserir (edge functions)
CREATE POLICY "Service role pode inserir ai_usage_logs"
  ON public.ai_usage_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Tabela de configurações do admin (câmbio, etc.)
CREATE TABLE public.admin_settings (
  id text PRIMARY KEY DEFAULT 'default',
  usd_to_brl numeric(10, 4) NOT NULL DEFAULT 5.80,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.perfis(id)
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar admin_settings"
  ON public.admin_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Permitir leitura pública para que edge functions consigam via service_role
CREATE POLICY "Service role pode ler admin_settings"
  ON public.admin_settings FOR SELECT
  USING (auth.role() = 'service_role');

-- Inserir valor padrão do câmbio
INSERT INTO public.admin_settings (id, usd_to_brl) VALUES ('default', 5.80);
