-- 1) Tabela de lançamentos manuais
CREATE TABLE public.custos_operacionais_manuais (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao text NOT NULL,
  valor numeric NOT NULL CHECK (valor >= 0),
  categoria text NOT NULL CHECK (categoria IN ('infraestrutura','servico','marketing','outro')),
  data_custo date NOT NULL DEFAULT CURRENT_DATE,
  recorrente boolean NOT NULL DEFAULT false,
  observacao text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL
);

ALTER TABLE public.custos_operacionais_manuais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins têm acesso total a custos_operacionais_manuais"
ON public.custos_operacionais_manuais
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_custos_manuais_updated_at
BEFORE UPDATE ON public.custos_operacionais_manuais
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_custos_manuais_data ON public.custos_operacionais_manuais(data_custo);

-- 2) View unificada de custos operacionais
CREATE OR REPLACE VIEW public.vw_custos_operacionais AS
WITH
-- Assinaturas: amortização mensal entre data_inicio e data_fim (ou mês corrente se sem fim)
assinaturas AS (
  SELECT
    'assinatura'::text AS origem,
    a.id AS origem_id,
    (a.identificacao || ' (' || a.provedor || ')') AS descricao,
    'assinatura'::text AS categoria,
    CASE
      WHEN a.data_fim IS NULL OR a.data_fim <= a.data_inicio THEN a.valor
      ELSE ROUND(
        a.valor / GREATEST(
          1,
          ((EXTRACT(YEAR FROM age(a.data_fim, a.data_inicio)) * 12)
            + EXTRACT(MONTH FROM age(a.data_fim, a.data_inicio)))::int
        ), 2
      )
    END AS valor,
    gs::date AS data_custo,
    to_char(gs, 'YYYY-MM') AS mes_ref
  FROM public.assinaturas_operacionais a
  CROSS JOIN LATERAL generate_series(
    date_trunc('month', a.data_inicio)::date,
    date_trunc('month', COALESCE(a.data_fim, CURRENT_DATE))::date,
    interval '1 month'
  ) AS gs
),
-- Recargas de chip
recargas AS (
  SELECT
    'recarga_chip'::text AS origem,
    r.id AS origem_id,
    ('Recarga chip #' || lpad(c.numero_id::text, 4, '0') || ' (' || c.numero || ')') AS descricao,
    'chip_recarga'::text AS categoria,
    r.valor,
    r.data_recarga AS data_custo,
    to_char(r.data_recarga, 'YYYY-MM') AS mes_ref
  FROM public.chip_recargas r
  JOIN public.chip_celulares c ON c.id = r.chip_id
),
-- Custo de aquisição de chip (uma vez na data_compra)
chips AS (
  SELECT
    'chip_aquisicao'::text AS origem,
    c.id AS origem_id,
    ('Aquisição chip #' || lpad(c.numero_id::text, 4, '0') || ' (' || c.numero || ')') AS descricao,
    'chip_aquisicao'::text AS categoria,
    c.custo_chip AS valor,
    c.data_compra AS data_custo,
    to_char(c.data_compra, 'YYYY-MM') AS mes_ref
  FROM public.chip_celulares c
  WHERE c.custo_chip > 0
),
-- Manuais: se recorrente, expande mês a mês até hoje
manuais AS (
  SELECT
    'manual'::text AS origem,
    m.id AS origem_id,
    m.descricao,
    m.categoria,
    m.valor,
    CASE WHEN m.recorrente THEN gs::date ELSE m.data_custo END AS data_custo,
    CASE WHEN m.recorrente THEN to_char(gs, 'YYYY-MM') ELSE to_char(m.data_custo, 'YYYY-MM') END AS mes_ref
  FROM public.custos_operacionais_manuais m
  LEFT JOIN LATERAL generate_series(
    date_trunc('month', m.data_custo)::date,
    date_trunc('month', CURRENT_DATE)::date,
    interval '1 month'
  ) AS gs ON m.recorrente
)
SELECT * FROM assinaturas
UNION ALL SELECT * FROM recargas
UNION ALL SELECT * FROM chips
UNION ALL SELECT * FROM manuais;

GRANT SELECT ON public.vw_custos_operacionais TO authenticated;