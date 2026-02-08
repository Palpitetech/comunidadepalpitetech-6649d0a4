-- Tabela de resultados da Mega Sena
CREATE TABLE public.resultados_megasena (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  concurso_id INTEGER NOT NULL UNIQUE,
  data_sorteio DATE NOT NULL,
  dezenas INTEGER[] NOT NULL,
  acumulou BOOLEAN DEFAULT false,
  valor_acumulado NUMERIC(15,2),
  valor_estimado_proximo NUMERIC(15,2),
  locais_ganhadores JSONB,
  premiacao_json JSONB,
  local_sorteio TEXT,
  -- Estatísticas pré-calculadas
  qtd_pares INTEGER,
  qtd_impares INTEGER,
  qtd_primos INTEGER,
  qtd_moldura INTEGER,
  qtd_repetidas INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_megasena_concurso ON public.resultados_megasena(concurso_id DESC);
CREATE INDEX idx_megasena_data ON public.resultados_megasena(data_sorteio DESC);

-- Habilitar RLS
ALTER TABLE public.resultados_megasena ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (resultados são públicos)
CREATE POLICY "Resultados da Mega Sena são públicos" 
ON public.resultados_megasena 
FOR SELECT 
USING (true);

-- Apenas service role pode inserir/atualizar
CREATE POLICY "Apenas service role pode modificar resultados" 
ON public.resultados_megasena 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');