-- Corrige título alucinado do post de resultado do concurso 3667
UPDATE public.postagens
SET titulo = '🚨 Resultado Lotofácil — Concurso 3667'
WHERE concurso_referencia = 3667
  AND tipo = 'resultado_oficial';