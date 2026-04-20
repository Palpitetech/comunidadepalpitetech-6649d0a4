
-- Sequence for sequential numero_id
CREATE SEQUENCE IF NOT EXISTS public.chip_celulares_numero_id_seq START 1;

-- Main table
CREATE TABLE public.chip_celulares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_id integer NOT NULL UNIQUE DEFAULT nextval('public.chip_celulares_numero_id_seq'),
  numero text NOT NULL,
  operadora text NOT NULL CHECK (operadora IN ('tim', 'claro', 'vivo')),
  plano_tipo text NOT NULL CHECK (plano_tipo IN ('pre', 'pos', 'controle')),
  valor_plano numeric NOT NULL DEFAULT 0 CHECK (valor_plano >= 0),
  custo_chip numeric NOT NULL DEFAULT 0 CHECK (custo_chip >= 0),
  data_compra date NOT NULL DEFAULT CURRENT_DATE,
  ultima_recarga_at timestamptz NULL,
  ultima_recarga_valor numeric NULL,
  ativo boolean NOT NULL DEFAULT true,
  observacao text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER SEQUENCE public.chip_celulares_numero_id_seq OWNED BY public.chip_celulares.numero_id;

-- Recharges table
CREATE TABLE public.chip_recargas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chip_id uuid NOT NULL REFERENCES public.chip_celulares(id) ON DELETE CASCADE,
  valor numeric NOT NULL CHECK (valor >= 0),
  data_recarga date NOT NULL DEFAULT CURRENT_DATE,
  metodo text NULL,
  observacao text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL
);

CREATE INDEX idx_chip_recargas_chip_id ON public.chip_recargas(chip_id);
CREATE INDEX idx_chip_recargas_data ON public.chip_recargas(data_recarga DESC);

-- Updated at trigger
CREATE TRIGGER trg_chip_celulares_updated_at
BEFORE UPDATE ON public.chip_celulares
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger function to recalc ultima_recarga
CREATE OR REPLACE FUNCTION public.update_chip_ultima_recarga()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_chip_id uuid;
  v_last record;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_chip_id := OLD.chip_id;
  ELSE
    v_chip_id := NEW.chip_id;
  END IF;

  SELECT data_recarga, valor, created_at
    INTO v_last
  FROM public.chip_recargas
  WHERE chip_id = v_chip_id
  ORDER BY data_recarga DESC, created_at DESC
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.chip_celulares
    SET ultima_recarga_at = v_last.created_at,
        ultima_recarga_valor = v_last.valor
    WHERE id = v_chip_id;
  ELSE
    UPDATE public.chip_celulares
    SET ultima_recarga_at = NULL,
        ultima_recarga_valor = NULL
    WHERE id = v_chip_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_chip_recargas_update_ultima
AFTER INSERT OR DELETE ON public.chip_recargas
FOR EACH ROW
EXECUTE FUNCTION public.update_chip_ultima_recarga();

-- RLS
ALTER TABLE public.chip_celulares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chip_recargas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins têm acesso total a chip_celulares"
ON public.chip_celulares
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins têm acesso total a chip_recargas"
ON public.chip_recargas
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
