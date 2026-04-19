
## Investigação

Na página `/` (Central.tsx), a seção "Últimos Resultados" usa o componente `<LatestResults />`, que consome o hook `useLatestResults`. O usuário quer garantir que TODAS as 6 loterias apareçam: Lotofácil, Quina, Mega-Sena, Lotomania, Dupla Sena e Dia de Sorte.

Preciso checar o estado atual do hook `useLatestResults` para ver quais loterias estão sendo retornadas, e também o `LatestResults.tsx` para garantir que todas sejam renderizadas.
