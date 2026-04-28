-- 1. Função de sincronização: whatsapp = celular sempre
CREATE OR REPLACE FUNCTION public.sync_whatsapp_with_celular()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.whatsapp := NEW.celular;
  RETURN NEW;
END;
$$;

-- 2. Trigger BEFORE INSERT OR UPDATE em perfis
DROP TRIGGER IF EXISTS trg_sync_whatsapp_celular ON public.perfis;
CREATE TRIGGER trg_sync_whatsapp_celular
BEFORE INSERT OR UPDATE OF celular ON public.perfis
FOR EACH ROW
EXECUTE FUNCTION public.sync_whatsapp_with_celular();

-- 3. Back-fill imediato (corrige os 9 perfis divergentes)
UPDATE public.perfis
SET celular = celular
WHERE whatsapp IS DISTINCT FROM celular;