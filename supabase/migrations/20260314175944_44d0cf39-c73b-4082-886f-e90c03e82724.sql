
-- Tabela principal de bolões
CREATE TABLE boloes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  loteria text NOT NULL,
  sigla text NOT NULL,
  numero_bolao int NOT NULL,
  mes_ano text NOT NULL,
  concurso_numero text NOT NULL,
  data_concurso date NOT NULL,
  total_palpites int NOT NULL,
  dezenas_por_palpite int NOT NULL,
  total_cotas int NOT NULL,
  valor_cota decimal(10,2) NOT NULL,
  valor_premiacao decimal(10,2) DEFAULT 0,
  descricao_estrategia text,
  palpites jsonb DEFAULT '[]',
  status text DEFAULT 'rascunho',
  cotas_reservadas int DEFAULT 0,
  cotas_vendidas int DEFAULT 0,
  task_impresso boolean DEFAULT false,
  task_registrado boolean DEFAULT false,
  task_comprovantes boolean DEFAULT false,
  task_resgate boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cotas dos bolões
CREATE TABLE bolao_cotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bolao_id uuid REFERENCES boloes(id),
  numero_cota int NOT NULL,
  status text DEFAULT 'disponivel',
  user_id uuid REFERENCES perfis(id) ON DELETE SET NULL,
  reservado_por text,
  observacao text,
  created_at timestamptz DEFAULT now()
);

-- Resgates
CREATE TABLE bolao_resgates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bolao_id uuid REFERENCES boloes(id),
  user_id uuid REFERENCES perfis(id),
  valor decimal(10,2),
  status text DEFAULT 'pendente',
  created_at timestamptz DEFAULT now()
);

-- Saldo transações
CREATE TABLE saldo_transacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES perfis(id),
  tipo text NOT NULL,
  valor decimal(10,2) NOT NULL,
  status text DEFAULT 'pendente',
  referencia_id uuid,
  descricao text,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE boloes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bolao_cotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE bolao_resgates ENABLE ROW LEVEL SECURITY;
ALTER TABLE saldo_transacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin acessa boloes" ON boloes FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin acessa bolao_cotas" ON bolao_cotas FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin acessa resgates" ON bolao_resgates FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin acessa saldo_transacoes" ON saldo_transacoes FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Função para gerar código do bolão
CREATE OR REPLACE FUNCTION generate_bolao_codigo(p_sigla text, p_mes_ano text)
RETURNS text AS $$
DECLARE
  next_num int;
  codigo text;
BEGIN
  SELECT COALESCE(MAX(numero_bolao), 0) + 1 INTO next_num FROM boloes WHERE sigla = p_sigla;
  codigo := p_sigla || '-' || LPAD(next_num::text, 4, '0') || '-' || p_mes_ano;
  RETURN codigo;
END;
$$ LANGUAGE plpgsql;
