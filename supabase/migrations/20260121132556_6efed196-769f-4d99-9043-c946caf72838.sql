-- =============================================
-- FASE 1: Gestão de Planos Dinâmicos
-- =============================================

-- 1. Criar tabela de planos
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  price decimal(10,2) NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 2. Habilitar RLS na tabela plans
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para plans
CREATE POLICY "Planos são públicos para leitura"
  ON public.plans
  FOR SELECT
  USING (true);

CREATE POLICY "Apenas admins podem inserir planos"
  ON public.plans
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admins podem atualizar planos"
  ON public.plans
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admins podem deletar planos"
  ON public.plans
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- 3. Atualizar tabela perfis com novos campos
ALTER TABLE public.perfis
  ADD COLUMN plan_id uuid REFERENCES public.plans(id),
  ADD COLUMN custom_features jsonb,
  ADD COLUMN whatsapp text,
  ADD COLUMN is_blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN admin_notes text;

-- 4. Inserir plano padrão "Grátis"
INSERT INTO public.plans (name, slug, price, features, display_order)
VALUES (
  'Grátis',
  'gratis',
  0,
  '{
    "gerador": false,
    "estatisticas": true,
    "quentes_frias": true,
    "ciclos": false,
    "comunidade_full": true,
    "guias": true,
    "notificacoes_push": true,
    "notificacoes_email": false,
    "notificacoes_sms": false
  }',
  0
);

-- 5. Atribuir plano grátis a todos os usuários existentes
UPDATE public.perfis 
SET plan_id = (SELECT id FROM public.plans WHERE slug = 'gratis')
WHERE plan_id IS NULL;