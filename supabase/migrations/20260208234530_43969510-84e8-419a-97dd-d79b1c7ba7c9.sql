-- Criar tabela para armazenar resultados da Dupla Sena
-- Estrutura especial: dois sorteios independentes por concurso

CREATE TABLE public.resultados_duplasena (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concurso_id INTEGER UNIQUE NOT NULL,
  data_sorteio DATE NOT NULL,
  
  -- Sorteio 1 (6 dezenas)
  dezenas_sorteio1 INTEGER[] NOT NULL,
  qtd_pares_s1 INTEGER,
  qtd_impares_s1 INTEGER,
  qtd_moldura_s1 INTEGER,
  qtd_primos_s1 INTEGER,
  qtd_repetidas_s1 INTEGER,
  
  -- Sorteio 2 (6 dezenas)
  dezenas_sorteio2 INTEGER[] NOT NULL,
  qtd_pares_s2 INTEGER,
  qtd_impares_s2 INTEGER,
  qtd_moldura_s2 INTEGER,
  qtd_primos_s2 INTEGER,
  qtd_repetidas_s2 INTEGER,
  
  -- Premiação e valores
  acumulou BOOLEAN DEFAULT false,
  valor_acumulado NUMERIC,
  valor_estimado_proximo NUMERIC,
  premiacao_json JSONB,
  locais_ganhadores JSONB,
  local_sorteio TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para otimização de consultas
CREATE INDEX idx_resultados_duplasena_data ON public.resultados_duplasena(data_sorteio DESC);
CREATE INDEX idx_resultados_duplasena_concurso ON public.resultados_duplasena(concurso_id DESC);

-- Enable RLS
ALTER TABLE public.resultados_duplasena ENABLE ROW LEVEL SECURITY;

-- Resultados são públicos para leitura (qualquer pessoa pode consultar)
CREATE POLICY "Resultados da Dupla Sena são públicos"
  ON public.resultados_duplasena
  FOR SELECT
  USING (true);

-- Apenas service role pode modificar resultados (sync via edge function)
CREATE POLICY "Apenas service role pode modificar resultados Dupla Sena"
  ON public.resultados_duplasena
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Comentários na tabela
COMMENT ON TABLE public.resultados_duplasena IS 'Resultados históricos da Dupla Sena com dois sorteios por concurso';
COMMENT ON COLUMN public.resultados_duplasena.dezenas_sorteio1 IS 'Dezenas do primeiro sorteio (6 números de 1 a 50)';
COMMENT ON COLUMN public.resultados_duplasena.dezenas_sorteio2 IS 'Dezenas do segundo sorteio (6 números de 1 a 50)';