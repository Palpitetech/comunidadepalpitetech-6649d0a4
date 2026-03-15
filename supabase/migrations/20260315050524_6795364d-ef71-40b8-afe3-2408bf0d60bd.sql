
-- ═══════════════════════════════════════════════════════════════
-- TABELA UNIFICADA: resultados_loterias
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.resultados_loterias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loteria text NOT NULL,
  concurso integer NOT NULL,
  data_sorteio date NOT NULL,
  dezenas integer[] NOT NULL,
  dezenas_sorteio2 integer[],
  acumulou boolean DEFAULT false,
  valor_acumulado numeric,
  valor_estimado_proximo numeric,
  valor_acumulado_especial numeric,
  valor_premio_principal numeric,
  data_proximo_concurso date,
  premiacao_json jsonb DEFAULT '[]'::jsonb,
  locais_ganhadores jsonb DEFAULT '[]'::jsonb,
  local_sorteio text,
  mes_sorte text,
  qtd_pares integer,
  qtd_impares integer,
  qtd_moldura integer,
  qtd_primos integer,
  qtd_repetidas integer,
  qtd_pares_s2 integer,
  qtd_impares_s2 integer,
  qtd_moldura_s2 integer,
  qtd_primos_s2 integer,
  qtd_repetidas_s2 integer,
  ciclo_numero integer,
  dezenas_faltantes_ciclo integer[],
  created_at timestamptz DEFAULT now(),
  UNIQUE(loteria, concurso)
);

-- RLS
ALTER TABLE public.resultados_loterias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura publica resultados_loterias"
  ON public.resultados_loterias FOR SELECT TO public USING (true);

CREATE POLICY "Service role gerencia resultados_loterias"
  ON public.resultados_loterias FOR ALL TO public
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

-- Index
CREATE INDEX idx_resultados_loterias_lookup
  ON public.resultados_loterias(loteria, concurso DESC);

-- ═══════════════════════════════════════════════════════════════
-- MIGRAÇÃO DE DADOS
-- ═══════════════════════════════════════════════════════════════

-- 1. Lotofácil (resultados)
INSERT INTO public.resultados_loterias (
  loteria, concurso, data_sorteio, dezenas, acumulou,
  valor_estimado_proximo, valor_acumulado_especial,
  premiacao_json, locais_ganhadores, local_sorteio,
  qtd_pares, qtd_impares, qtd_moldura, qtd_primos, qtd_repetidas,
  ciclo_numero, dezenas_faltantes_ciclo, created_at
)
SELECT 'lotofacil', concurso_id, data_sorteio, dezenas, COALESCE(acumulou, false),
  valor_estimado_proximo, valor_acumulado_especial,
  COALESCE(premiacao_json::jsonb, '[]'::jsonb),
  COALESCE(locais_ganhadores::jsonb, '[]'::jsonb),
  local_sorteio,
  qtd_pares, qtd_impares, qtd_moldura, qtd_primos, qtd_repetidas,
  ciclo_numero, dezenas_faltantes_ciclo, created_at
FROM public.resultados
ON CONFLICT (loteria, concurso) DO NOTHING;

-- 2. Mega-Sena
INSERT INTO public.resultados_loterias (
  loteria, concurso, data_sorteio, dezenas, acumulou,
  valor_acumulado, valor_estimado_proximo,
  premiacao_json, locais_ganhadores, local_sorteio,
  qtd_pares, qtd_impares, qtd_moldura, qtd_primos, qtd_repetidas, created_at
)
SELECT 'megasena', concurso_id, data_sorteio, dezenas, COALESCE(acumulou, false),
  valor_acumulado, valor_estimado_proximo,
  COALESCE(premiacao_json::jsonb, '[]'::jsonb),
  COALESCE(locais_ganhadores::jsonb, '[]'::jsonb),
  local_sorteio,
  qtd_pares, qtd_impares, qtd_moldura, qtd_primos, qtd_repetidas, created_at
FROM public.resultados_megasena
ON CONFLICT (loteria, concurso) DO NOTHING;

-- 3. Dupla Sena
INSERT INTO public.resultados_loterias (
  loteria, concurso, data_sorteio, dezenas, dezenas_sorteio2, acumulou,
  valor_acumulado, valor_estimado_proximo,
  premiacao_json, locais_ganhadores, local_sorteio,
  qtd_pares, qtd_impares, qtd_moldura, qtd_primos, qtd_repetidas,
  qtd_pares_s2, qtd_impares_s2, qtd_moldura_s2, qtd_primos_s2, qtd_repetidas_s2,
  created_at
)
SELECT 'duplasena', concurso_id, data_sorteio, dezenas_sorteio1, dezenas_sorteio2, COALESCE(acumulou, false),
  valor_acumulado, valor_estimado_proximo,
  COALESCE(premiacao_json::jsonb, '[]'::jsonb),
  COALESCE(locais_ganhadores::jsonb, '[]'::jsonb),
  local_sorteio,
  qtd_pares_s1, qtd_impares_s1, qtd_moldura_s1, qtd_primos_s1, qtd_repetidas_s1,
  qtd_pares_s2, qtd_impares_s2, qtd_moldura_s2, qtd_primos_s2, qtd_repetidas_s2,
  created_at
FROM public.resultados_duplasena
ON CONFLICT (loteria, concurso) DO NOTHING;

-- 4. Quina (text[] → int[])
INSERT INTO public.resultados_loterias (
  loteria, concurso, data_sorteio, dezenas, acumulou,
  valor_acumulado, valor_estimado_proximo, valor_premio_principal,
  data_proximo_concurso, premiacao_json, created_at
)
SELECT 'quina', concurso, data_sorteio,
  ARRAY(SELECT unnest(dezenas)::integer),
  COALESCE(acumulou, false),
  valor_acumulado, valor_estimado_proximo, valor_premio_principal,
  data_proximo_concurso, COALESCE(premiacao_json::jsonb, '[]'::jsonb), created_at
FROM public.resultados_quina
ON CONFLICT (loteria, concurso) DO NOTHING;

-- 5. Lotomania (text[] → int[])
INSERT INTO public.resultados_loterias (
  loteria, concurso, data_sorteio, dezenas, acumulou,
  valor_acumulado, valor_estimado_proximo, valor_premio_principal,
  data_proximo_concurso, premiacao_json, created_at
)
SELECT 'lotomania', concurso, data_sorteio,
  ARRAY(SELECT unnest(dezenas)::integer),
  COALESCE(acumulou, false),
  valor_acumulado, valor_estimado_proximo, valor_premio_principal,
  data_proximo_concurso, COALESCE(premiacao_json::jsonb, '[]'::jsonb), created_at
FROM public.resultados_lotomania
ON CONFLICT (loteria, concurso) DO NOTHING;

-- 6. Dia de Sorte (text[] → int[])
INSERT INTO public.resultados_loterias (
  loteria, concurso, data_sorteio, dezenas, mes_sorte, acumulou,
  valor_acumulado, valor_estimado_proximo, valor_premio_principal,
  data_proximo_concurso, premiacao_json, created_at
)
SELECT 'diadesorte', concurso, data_sorteio,
  ARRAY(SELECT unnest(dezenas)::integer),
  mes_sorte,
  COALESCE(acumulou, false),
  valor_acumulado, valor_estimado_proximo, valor_premio_principal,
  data_proximo_concurso, COALESCE(premiacao_json::jsonb, '[]'::jsonb), created_at
FROM public.resultados_diadesorte
ON CONFLICT (loteria, concurso) DO NOTHING;
