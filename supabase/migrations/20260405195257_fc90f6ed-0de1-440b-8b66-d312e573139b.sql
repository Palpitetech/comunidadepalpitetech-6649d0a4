
-- Recriar helpers (podem já existir da migration anterior parcial)
CREATE OR REPLACE FUNCTION public.count_sequences(arr integer[])
RETURNS integer
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  sorted integer[];
  seq_count integer := 0;
  i integer;
BEGIN
  sorted := (SELECT array_agg(x ORDER BY x) FROM unnest(arr) x);
  IF array_length(sorted, 1) IS NULL OR array_length(sorted, 1) < 2 THEN
    RETURN 0;
  END IF;
  FOR i IN 2..array_length(sorted, 1) LOOP
    IF sorted[i] = sorted[i-1] + 1 THEN
      seq_count := seq_count + 1;
    END IF;
  END LOOP;
  RETURN seq_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.count_array_overlap(a integer[], b integer[])
RETURNS integer
LANGUAGE sql IMMUTABLE
AS $$
  SELECT count(*)::integer FROM unnest(a) x WHERE x = ANY(b);
$$;

-- LOTOFÁCIL
UPDATE resultados_loterias SET
  soma = (SELECT sum(x) FROM unnest(dezenas) x),
  sequencias = public.count_sequences(dezenas),
  qtd_fibonacci = (SELECT count(*)::integer FROM unnest(dezenas) x WHERE x = ANY(ARRAY[1,2,3,5,8,13,21]))
WHERE loteria = 'lotofacil' AND (soma IS NULL OR sequencias IS NULL OR qtd_fibonacci IS NULL);

-- MEGA-SENA
UPDATE resultados_loterias SET
  soma = (SELECT sum(x) FROM unnest(dezenas) x),
  sequencias = public.count_sequences(dezenas),
  qtd_fibonacci = (SELECT count(*)::integer FROM unnest(dezenas) x WHERE x = ANY(ARRAY[1,2,3,5,8,13,21,34,55]))
WHERE loteria = 'megasena' AND (soma IS NULL OR sequencias IS NULL OR qtd_fibonacci IS NULL);

-- DUPLA SENA (sorteio 1)
UPDATE resultados_loterias SET
  soma = (SELECT sum(x) FROM unnest(dezenas) x),
  sequencias = public.count_sequences(dezenas),
  qtd_fibonacci = (SELECT count(*)::integer FROM unnest(dezenas) x WHERE x = ANY(ARRAY[1,2,3,5,8,13,21,34]))
WHERE loteria = 'duplasena' AND (soma IS NULL OR sequencias IS NULL OR qtd_fibonacci IS NULL);

-- DUPLA SENA (sorteio 2)
UPDATE resultados_loterias SET
  soma_s2 = (SELECT sum(x) FROM unnest(dezenas_sorteio2) x),
  sequencias_s2 = public.count_sequences(dezenas_sorteio2),
  qtd_fibonacci_s2 = (SELECT count(*)::integer FROM unnest(dezenas_sorteio2) x WHERE x = ANY(ARRAY[1,2,3,5,8,13,21,34]))
WHERE loteria = 'duplasena' AND dezenas_sorteio2 IS NOT NULL AND (soma_s2 IS NULL OR sequencias_s2 IS NULL OR qtd_fibonacci_s2 IS NULL);

-- QUINA
UPDATE resultados_loterias SET
  soma = (SELECT sum(x) FROM unnest(dezenas) x),
  sequencias = public.count_sequences(dezenas),
  qtd_fibonacci = (SELECT count(*)::integer FROM unnest(dezenas) x WHERE x = ANY(ARRAY[1,2,3,5,8,13,21,34,55]))
WHERE loteria = 'quina' AND (soma IS NULL OR sequencias IS NULL OR qtd_fibonacci IS NULL);

-- LOTOMANIA
UPDATE resultados_loterias SET
  soma = (SELECT sum(x) FROM unnest(dezenas) x),
  sequencias = public.count_sequences(dezenas),
  qtd_fibonacci = (SELECT count(*)::integer FROM unnest(dezenas) x WHERE x = ANY(ARRAY[1,2,3,5,8,13,21,34,55,89]))
WHERE loteria = 'lotomania' AND (soma IS NULL OR sequencias IS NULL OR qtd_fibonacci IS NULL);

-- DIA DE SORTE
UPDATE resultados_loterias SET
  soma = (SELECT sum(x) FROM unnest(dezenas) x),
  sequencias = public.count_sequences(dezenas),
  qtd_fibonacci = (SELECT count(*)::integer FROM unnest(dezenas) x WHERE x = ANY(ARRAY[1,2,3,5,8,13,21]))
WHERE loteria = 'diadesorte' AND (soma IS NULL OR sequencias IS NULL OR qtd_fibonacci IS NULL);

-- REPETIDAS (todas as loterias)
WITH prev AS (
  SELECT loteria, concurso, dezenas,
    LAG(dezenas) OVER (PARTITION BY loteria ORDER BY concurso) AS dezenas_ant
  FROM resultados_loterias
)
UPDATE resultados_loterias r SET
  qtd_repetidas = COALESCE(public.count_array_overlap(p.dezenas, p.dezenas_ant), 0)
FROM prev p
WHERE r.loteria = p.loteria AND r.concurso = p.concurso AND p.dezenas_ant IS NOT NULL;

-- REPETIDAS S2 (Dupla Sena)
WITH prev_s2 AS (
  SELECT concurso, dezenas_sorteio2,
    LAG(dezenas_sorteio2) OVER (ORDER BY concurso) AS dezenas_s2_ant
  FROM resultados_loterias
  WHERE loteria = 'duplasena' AND dezenas_sorteio2 IS NOT NULL
)
UPDATE resultados_loterias r SET
  qtd_repetidas_s2 = COALESCE(public.count_array_overlap(p.dezenas_sorteio2, p.dezenas_s2_ant), 0)
FROM prev_s2 p
WHERE r.loteria = 'duplasena' AND r.concurso = p.concurso AND p.dezenas_s2_ant IS NOT NULL;
