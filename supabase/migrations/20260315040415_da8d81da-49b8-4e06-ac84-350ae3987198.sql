
CREATE TABLE faixas_premiacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loteria text NOT NULL,
  concurso text NOT NULL,
  faixa text NOT NULL,
  pontos_necessarios int NOT NULL,
  valor_premio numeric DEFAULT 0,
  ganhadores int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(loteria, concurso, faixa)
);

CREATE TABLE carteira_movimentacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  valor numeric NOT NULL,
  descricao text NOT NULL,
  bolao_id uuid REFERENCES boloes(id) ON DELETE SET NULL,
  referencia text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES perfis(id) ON DELETE SET NULL
);

ALTER TABLE faixas_premiacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE carteira_movimentacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin faixas" ON faixas_premiacao FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin carteira" ON carteira_movimentacoes FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
