
## Diagnóstico

A seção "Últimos Resultados" mostra "Aguardando..." porque o hook `useLatestResults` lê o prêmio estimado e a data do próximo sorteio do campo `valor_estimado_proximo` da tabela `resultados_loterias` — **mas esses campos estão `null`** para a maioria das loterias (confirmado nos network requests: Mega-Sena, Quina, Lotofácil, Dupla Sena, Lotomania, Dia de Sorte todos retornam `valor_estimado_proximo: null`).

Os dados corretos do próximo concurso ficam na tabela `proximos_concursos`, populada pela edge function `sync-proximos-concursos`. Confirmei via query:
- megasena → R$ 70.000.000, sorteio 2026-04-23
- quina → R$ 30.000.000, sorteio 2026-04-20
- lotofacil → R$ 2.000.000, sorteio 2026-04-20
- (todas as 6 loterias com dados corretos)

## Plano (somente arquivos da página `/`)

**Arquivo 1: `src/hooks/useLatestResults.ts`**
- Adicionar segunda busca em paralelo: `proximos_concursos` (todas as 6 loterias de uma vez).
- Fazer merge dos dois resultados por `loteria`, anexando `premio_estimado_proximo`, `data_proximo_concurso_real`, `numero_proximo_concurso`, `acumulado_proximo` ao objeto retornado.
- Adicionar **Realtime subscription** em `resultados_loterias` E `proximos_concursos`: ao detectar INSERT/UPDATE, invalidar a query `["latest-results"]` para refetch automático.
- Reduzir `staleTime` para 1 minuto (o realtime cuida do resto).

**Arquivo 2: `src/components/home/LatestResults.tsx`**
- Trocar a fonte de `valorEstimado` para o novo campo `premio_estimado_proximo` (com formatação BRL).
- Trocar `proximoSorteio` / `proximoDiaSemana` para usar `data_proximo_concurso_real` da tabela `proximos_concursos`.
- Trocar `proximoConcurso` para usar `numero_proximo_concurso` (em vez de `concurso + 1`).
- Manter fallback "Aguardando..." apenas se realmente não houver dado em `proximos_concursos`.

**Banco de dados**
- Habilitar Realtime nas tabelas: `ALTER PUBLICATION supabase_realtime ADD TABLE resultados_loterias, proximos_concursos;` (via migração).
- Definir `REPLICA IDENTITY FULL` nas duas tabelas para garantir payloads completos.

## Resumo técnico

- 2 arquivos editados + 1 migração SQL
- Sem alterações em outras páginas, componentes, edge functions ou backend além do `ALTER PUBLICATION`
- Dados de prêmio/data passam a vir de `proximos_concursos` (fonte correta)
- Auto-update via Realtime: assim que `sync-proximos-concursos` ou `sync-<loteria>` rodar e atualizar uma linha, a UI refaz fetch automaticamente
