-- Garantir REPLICA IDENTITY FULL para payloads completos
ALTER TABLE public.resultados_loterias REPLICA IDENTITY FULL;
ALTER TABLE public.proximos_concursos REPLICA IDENTITY FULL;

-- Adicionar tabelas à publicação realtime (idempotente via DO block)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.resultados_loterias;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.proximos_concursos;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;