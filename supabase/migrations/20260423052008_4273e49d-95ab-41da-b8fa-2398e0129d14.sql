ALTER TABLE public.postagens DROP CONSTRAINT IF EXISTS postagens_tipo_check;

ALTER TABLE public.postagens ADD CONSTRAINT postagens_tipo_check
CHECK (tipo::text = ANY (ARRAY[
  'comentario','palpite','analise','resultado_oficial','estrategia','vendas','vendas_sistema',
  'pos_sorteio','pre_sorteio','analise_ciclo','analise_movimentacao','analise_pares_impares',
  'analise_repetidas','analise_moldura','analise_linhas','analise_colunas',
  'analise_posicoes_iniciais','analise_posicoes_finais'
]::text[]));