-- 1. Renomear a tabela
ALTER TABLE public.investimentos RENAME TO assinaturas_operacionais;

-- 2. Renomear índices
ALTER INDEX IF EXISTS public.idx_investimentos_data_inicio RENAME TO idx_assinaturas_operacionais_data_inicio;
ALTER INDEX IF EXISTS public.idx_investimentos_provedor RENAME TO idx_assinaturas_operacionais_provedor;

-- 3. Remover triggers antigos antes de remover a função
DROP TRIGGER IF EXISTS trg_validate_investimento ON public.assinaturas_operacionais;
DROP TRIGGER IF EXISTS trg_update_investimentos_updated_at ON public.assinaturas_operacionais;

-- 4. Criar nova função de validação com o novo nome
CREATE OR REPLACE FUNCTION public.validate_assinatura_operacional()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Garante valor não-negativo
  IF NEW.valor < 0 THEN
    RAISE EXCEPTION 'O valor da assinatura não pode ser negativo';
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
$function$;

-- 5. Recriar triggers com nomes novos apontando para a nova função
CREATE TRIGGER trg_validate_assinatura_operacional
BEFORE INSERT OR UPDATE ON public.assinaturas_operacionais
FOR EACH ROW
EXECUTE FUNCTION public.validate_assinatura_operacional();

CREATE TRIGGER trg_update_assinaturas_operacionais_updated_at
BEFORE UPDATE ON public.assinaturas_operacionais
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Remover função antiga (após triggers já apontarem para a nova)
DROP FUNCTION IF EXISTS public.validate_investimento();

-- 7. Renomear políticas RLS existentes (mantendo a mesma regra)
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'assinaturas_operacionais'
  LOOP
    EXECUTE format('ALTER POLICY %I ON public.assinaturas_operacionais RENAME TO %I',
      pol.policyname,
      replace(pol.policyname, 'investimento', 'assinatura_operacional')
    );
  END LOOP;
END $$;