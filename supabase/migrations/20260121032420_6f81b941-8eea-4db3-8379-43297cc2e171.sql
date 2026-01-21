-- Create guide_personas table for specialist guides
CREATE TABLE public.guide_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  
  -- Identity
  cargo VARCHAR(100) NOT NULL,
  especialidade VARCHAR(100) NOT NULL,
  badge_emoji VARCHAR(10) DEFAULT '🛡️',
  
  -- AI Configuration
  system_prompt TEXT NOT NULL,
  estilo_escrita VARCHAR(50) DEFAULT 'profissional',
  
  -- Behavior
  frequencia_posts INTEGER DEFAULT 2,
  ativo BOOLEAN DEFAULT true,
  ultimo_post_em TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(perfil_id)
);

-- Enable RLS
ALTER TABLE public.guide_personas ENABLE ROW LEVEL SECURITY;

-- Only admins can manage guide_personas
CREATE POLICY "Apenas admins podem gerenciar guide_personas"
  ON public.guide_personas FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Guide personas are visible for reading (to display badges)
CREATE POLICY "Guide personas são visíveis para leitura"
  ON public.guide_personas FOR SELECT USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_guide_personas_updated_at
  BEFORE UPDATE ON public.guide_personas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();