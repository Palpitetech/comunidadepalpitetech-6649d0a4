
-- Tabela Quina
CREATE TABLE public.resultados_quina (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concurso integer UNIQUE NOT NULL,
  data_sorteio date NOT NULL,
  dezenas text[] NOT NULL,
  acumulou boolean DEFAULT false,
  valor_acumulado numeric DEFAULT 0,
  valor_premio_principal numeric DEFAULT 0,
  data_proximo_concurso date,
  valor_estimado_proximo numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Tabela Dia de Sorte
CREATE TABLE public.resultados_diadesorte (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concurso integer UNIQUE NOT NULL,
  data_sorteio date NOT NULL,
  dezenas text[] NOT NULL,
  mes_sorte text,
  acumulou boolean DEFAULT false,
  valor_acumulado numeric DEFAULT 0,
  valor_premio_principal numeric DEFAULT 0,
  data_proximo_concurso date,
  valor_estimado_proximo numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Tabela Lotomania
CREATE TABLE public.resultados_lotomania (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concurso integer UNIQUE NOT NULL,
  data_sorteio date NOT NULL,
  dezenas text[] NOT NULL,
  acumulou boolean DEFAULT false,
  valor_acumulado numeric DEFAULT 0,
  valor_premio_principal numeric DEFAULT 0,
  data_proximo_concurso date,
  valor_estimado_proximo numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.resultados_quina ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resultados_diadesorte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resultados_lotomania ENABLE ROW LEVEL SECURITY;

-- Leitura pública
CREATE POLICY "Leitura publica quina" ON public.resultados_quina FOR SELECT TO public USING (true);
CREATE POLICY "Leitura publica diadesorte" ON public.resultados_diadesorte FOR SELECT TO public USING (true);
CREATE POLICY "Leitura publica lotomania" ON public.resultados_lotomania FOR SELECT TO public USING (true);

-- Escrita service_role
CREATE POLICY "Service role quina" ON public.resultados_quina FOR ALL TO public USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role diadesorte" ON public.resultados_diadesorte FOR ALL TO public USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role lotomania" ON public.resultados_lotomania FOR ALL TO public USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
