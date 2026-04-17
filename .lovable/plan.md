## Investigação

O usuário reporta que na seção "Últimos Resultados" da página `/` (Central.tsx) só aparece a Quina, mas deveria mostrar todas as loterias.

A página `Central.tsx` usa `<LatestResults />`, que por sua vez consome `useLatestResults`. Preciso verificar esse hook para entender por que apenas Lotofácil aparece.