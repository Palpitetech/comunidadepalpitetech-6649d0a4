-- Adicionar coluna parent_id para hierarquia de pastas
ALTER TABLE public.palpites_pastas 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.palpites_pastas(id) ON DELETE SET NULL;

-- Adicionar coluna is_root para identificar pastas raiz (loterias)
ALTER TABLE public.palpites_pastas 
ADD COLUMN IF NOT EXISTS is_root BOOLEAN DEFAULT false;

-- Criar índice para melhor performance em buscas hierárquicas
CREATE INDEX IF NOT EXISTS idx_palpites_pastas_parent_id ON public.palpites_pastas(parent_id);
CREATE INDEX IF NOT EXISTS idx_palpites_pastas_is_root ON public.palpites_pastas(is_root) WHERE is_root = true;