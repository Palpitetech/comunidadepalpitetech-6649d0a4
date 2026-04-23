DELETE FROM public.postagens
WHERE id IN (
  SELECT id FROM public.postagens
  WHERE tipo = 'analise_linhas'
  ORDER BY created_at DESC
  LIMIT 1
);

DELETE FROM public.postagens
WHERE id IN (
  SELECT id FROM public.postagens
  WHERE tipo = 'analise_colunas'
  ORDER BY created_at DESC
  LIMIT 1
);