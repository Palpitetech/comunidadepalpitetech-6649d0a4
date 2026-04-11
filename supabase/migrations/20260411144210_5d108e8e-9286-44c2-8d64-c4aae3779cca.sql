-- Adicionar coluna para rastrear dezenas faltantes do ciclo na tabela resultados
ALTER TABLE public.resultados 
ADD COLUMN IF NOT EXISTS dezenas_faltantes_ciclo integer[];

-- Adicionar coluna metadata para postagens de bots na tabela postagens
ALTER TABLE public.postagens 
ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Garantir que as colunas sejam acessíveis via API se necessário (RLS já deve estar habilitado)
-- Nota: Como são apenas adições de colunas, as políticas existentes de SELECT devem cobri-las automaticamente se forem genéricas.