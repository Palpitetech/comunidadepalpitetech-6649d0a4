CREATE OR REPLACE FUNCTION public.validate_post_schedule()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  loterias_validas text[] := ARRAY['lotofacil', 'megasena'];
  tipos_lotofacil text[] := ARRAY[
    'analise_ciclo',
    'analise_movimentacao',
    'analise_moldura',
    'analise_repetidas',
    'analise_linhas',
    'analise_colunas',
    'analise_posicoes_iniciais',
    'analise_posicoes_finais',
    'analise_cenarios',
    'analise_ficar_de_olho',
    'analise_como_calculamos',
    'resultado_oficial'
  ];
  tipos_megasena text[] := ARRAY[
    'analise_movimentacao',
    'analise_moldura',
    'analise_repetidas',
    'analise_linhas',
    'analise_colunas',
    'analise_posicoes_iniciais',
    'analise_posicoes_finais',
    'analise_como_calculamos',
    'resultado_oficial'
  ];
  tipos_validos text[];
BEGIN
  IF NEW.loteria IS NULL OR NOT (NEW.loteria = ANY(loterias_validas)) THEN
    RAISE EXCEPTION 'Loteria "%" não cadastrada. Loterias válidas: %',
      NEW.loteria, array_to_string(loterias_validas, ', ')
      USING ERRCODE = 'check_violation';
  END IF;

  CASE NEW.loteria
    WHEN 'lotofacil' THEN tipos_validos := tipos_lotofacil;
    WHEN 'megasena' THEN tipos_validos := tipos_megasena;
    ELSE tipos_validos := ARRAY[]::text[];
  END CASE;

  IF NOT (NEW.tipo_post = ANY(tipos_validos)) THEN
    RAISE EXCEPTION 'Tipo "%" não suportado para loteria "%". Tipos válidos: %',
      NEW.tipo_post, NEW.loteria, array_to_string(tipos_validos, ', ')
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.horario !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN
    RAISE EXCEPTION 'Horário "%" inválido. Use formato HH:MM (00:00–23:59).', NEW.horario
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.dias IS NULL OR array_length(NEW.dias, 1) IS NULL THEN
    RAISE EXCEPTION 'Campo "dias" não pode ser vazio.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF EXISTS (SELECT 1 FROM unnest(NEW.dias) AS d WHERE d < 0 OR d > 6) THEN
    RAISE EXCEPTION 'Campo "dias" contém valor fora de 0–6: %', NEW.dias
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$function$;