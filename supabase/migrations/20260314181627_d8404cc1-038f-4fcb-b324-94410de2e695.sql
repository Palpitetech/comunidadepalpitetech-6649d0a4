CREATE TABLE proximos_concursos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loteria text UNIQUE NOT NULL,
  numero_concurso text NOT NULL,
  data_sorteio date,
  premio_estimado decimal(14,2) DEFAULT 0,
  acumulado boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE proximos_concursos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Proximos concursos são públicos para leitura"
ON proximos_concursos FOR SELECT TO public
USING (true);

CREATE POLICY "Service role pode gerenciar proximos_concursos"
ON proximos_concursos FOR ALL TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');