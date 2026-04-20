DROP VIEW IF EXISTS public.vw_custos_operacionais;

CREATE OR REPLACE VIEW public.vw_custos_operacionais
WITH (security_invoker = true) AS
-- 1) Assinaturas operacionais (amortizado por mês entre data_inicio e data_fim)
WITH assin_meses AS (
  SELECT
    a.id,
    a.identificacao,
    a.provedor,
    a.valor,
    a.periodo_validade,
    a.data_inicio,
    COALESCE(a.data_fim, a.data_inicio + INTERVAL '1 month' - INTERVAL '1 day')::date AS data_fim_calc
  FROM public.assinaturas_operacionais a
),
assin_expandido AS (
  SELECT
    am.id,
    am.identificacao,
    am.provedor,
    am.periodo_validade,
    GREATEST(
      1,
      (DATE_PART('year', am.data_fim_calc) - DATE_PART('year', am.data_inicio)) * 12
      + (DATE_PART('month', am.data_fim_calc) - DATE_PART('month', am.data_inicio)) + 1
    )::int AS n_meses,
    am.valor,
    gs.mes_data
  FROM assin_meses am
  CROSS JOIN LATERAL generate_series(
    date_trunc('month', am.data_inicio),
    date_trunc('month', am.data_fim_calc),
    INTERVAL '1 month'
  ) AS gs(mes_data)
)
SELECT
  'assinatura'::text                                AS origem,
  id::text                                          AS origem_id,
  ('Assinatura: ' || identificacao || ' (' || provedor || ')') AS descricao,
  'servico'::text                                   AS categoria,
  periodo_validade                                  AS periodo,
  ROUND((valor / n_meses)::numeric, 2)              AS valor,
  mes_data::date                                    AS data_custo,
  TO_CHAR(mes_data, 'YYYY-MM')                      AS mes_ref
FROM assin_expandido

UNION ALL

-- 2) Recargas de chip
SELECT
  'recarga_chip'::text                              AS origem,
  r.id::text                                        AS origem_id,
  ('Recarga: ' || c.numero || ' (' || c.operadora || ')') AS descricao,
  'servico'::text                                   AS categoria,
  'avulso'::text                                    AS periodo,
  r.valor                                           AS valor,
  r.data_recarga                                    AS data_custo,
  TO_CHAR(r.data_recarga, 'YYYY-MM')                AS mes_ref
FROM public.chip_recargas r
JOIN public.chip_celulares c ON c.id = r.chip_id

UNION ALL

-- 3) Aquisição de chip (custo único)
SELECT
  'chip_aquisicao'::text                            AS origem,
  c.id::text                                        AS origem_id,
  ('Aquisição chip: ' || c.numero || ' (' || c.operadora || ')') AS descricao,
  'infraestrutura'::text                            AS categoria,
  'unico'::text                                     AS periodo,
  c.custo_chip                                      AS valor,
  c.data_compra                                     AS data_custo,
  TO_CHAR(c.data_compra, 'YYYY-MM')                 AS mes_ref
FROM public.chip_celulares c
WHERE c.custo_chip > 0

UNION ALL

-- 4) Manuais (avulsos)
SELECT
  'manual'::text                                    AS origem,
  m.id::text                                        AS origem_id,
  m.descricao                                       AS descricao,
  m.categoria                                       AS categoria,
  'avulso'::text                                    AS periodo,
  m.valor                                           AS valor,
  m.data_custo                                      AS data_custo,
  TO_CHAR(m.data_custo, 'YYYY-MM')                  AS mes_ref
FROM public.custos_operacionais_manuais m
WHERE m.recorrente = false

UNION ALL

-- 5) Manuais (recorrentes mensais — expande até o mês corrente)
SELECT
  'manual'::text                                    AS origem,
  m.id::text                                        AS origem_id,
  m.descricao                                       AS descricao,
  m.categoria                                       AS categoria,
  'mensal_recorrente'::text                         AS periodo,
  m.valor                                           AS valor,
  gs.mes_data::date                                 AS data_custo,
  TO_CHAR(gs.mes_data, 'YYYY-MM')                   AS mes_ref
FROM public.custos_operacionais_manuais m
CROSS JOIN LATERAL generate_series(
  date_trunc('month', m.data_custo),
  date_trunc('month', CURRENT_DATE),
  INTERVAL '1 month'
) AS gs(mes_data)
WHERE m.recorrente = true;

GRANT SELECT ON public.vw_custos_operacionais TO authenticated;