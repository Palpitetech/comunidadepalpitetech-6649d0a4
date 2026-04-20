-- Tabela investimentos
CREATE TABLE public.investimentos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identificacao text NOT NULL,
  valor numeric(12,2) NOT NULL DEFAULT 0,
  provedor text NOT NULL,
  periodo_validade text NOT NULL CHECK (periodo_validade IN ('1_mes', '3_meses', '6_meses', '12_meses', 'nd', 'personalizado')),
  periodo_dias_custom integer,
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  data_fim date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Função de validação + cálculo de data_fim
CREATE OR REPLACE FUNCTION public.validate_investimento()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Garante valor não-negativo
  IF NEW.valor < 0 THEN
    RAISE EXCEPTION 'O valor do investimento não pode ser negativo';
  END IF;

  -- Regras para periodo_dias_custom
  IF NEW.periodo_validade = 'personalizado' THEN
    IF NEW.periodo_dias_custom IS NULL OR NEW.periodo_dias_custom <= 0 THEN
      RAISE EXCEPTION 'Para período personalizado, informe a quantidade de dias (> 0)';
    END IF;
  ELSE
    NEW.periodo_dias_custom := NULL;
  END IF;

  -- Calcula data_fim automaticamente
  NEW.data_fim := CASE NEW.periodo_validade
    WHEN '1_mes' THEN NEW.data_inicio + INTERVAL '1 month'
    WHEN '3_meses' THEN NEW.data_inicio + INTERVAL '3 months'
    WHEN '6_meses' THEN NEW.data_inicio + INTERVAL '6 months'
    WHEN '12_meses' THEN NEW.data_inicio + INTERVAL '12 months'
    WHEN 'personalizado' THEN NEW.data_inicio + (NEW.periodo_dias_custom || ' days')::interval
    WHEN 'nd' THEN NULL
  END;

  RETURN NEW;
END;
$$;

-- Triggers
CREATE TRIGGER trg_validate_investimento
BEFORE INSERT OR UPDATE ON public.investimentos
FOR EACH ROW
EXECUTE FUNCTION public.validate_investimento();

CREATE TRIGGER trg_update_investimentos_updated_at
BEFORE UPDATE ON public.investimentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.investimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins têm acesso total a investimentos"
ON public.investimentos
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Índices
CREATE INDEX idx_investimentos_data_inicio ON public.investimentos (data_inicio DESC);
CREATE INDEX idx_investimentos_provedor ON public.investimentos (provedor);