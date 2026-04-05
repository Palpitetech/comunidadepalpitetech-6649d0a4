## Plano de Limpeza — Código Morto

### Fase 1: Edge Functions (4 itens)
1. **Deletar `palpitetech-post`** — nunca chamada, sem referências no código
2. **Deletar `reenviar-ativacao`** — substituída por `enviar-codigo-email`
3. **Deletar `send-notifications`** — substituída por `send-push`
4. **Deletar `identificar-conta`** — redundante com consulta direta à tabela `perfis`

### Fase 2: Hooks React (7 itens)
5. **Deletar `useDiaDeSorteResultados.ts`** — não importado em nenhum componente
6. **Deletar `useDuplaSenaResultados.ts`** — não importado (páginas usam hooks específicos)
7. **Deletar `useLotomaniaResultados.ts`** — não importado em nenhum componente
8. **Deletar `useQuinaResultados.ts`** — não importado em nenhum componente
9. **Deletar `useFeatureGate.ts`** — não importado, substituído por `usePermission`
10. **Deletar `useMegaSenaTendencias.ts`** — não importado, a página usa `useTendenciasMegaSena`
11. **Deletar `useTabelaMovimentacaoDuplaSena.ts`** — não importado, substituído por `useTabelaMovimentacaoDuplaSenaGrid`

### Fase 3: Componentes React (13 itens)
12. **Deletar `NavLink.tsx`** — não importado em nenhum arquivo
13. **Deletar `ResultadoDetalhesSheetBase.tsx`** — não importado
14. **Deletar `admin/LeadWebhookCard.tsx`** — não importado
15. **Deletar `fechamento/GridDezenasVolante.tsx`** — não importado
16. **Deletar `fechamento/DezenaVolante.tsx`** — não importado
17. **Deletar `fechamento/ModoChaveSelector.tsx`** — não importado
18. **Deletar `fechamento/TipoFechamentoSelector.tsx`** — não importado
19. **Deletar `gerador/PedidoEspecialInput.tsx`** — não importado
20. **Deletar `gerador/PeriodoAnaliseSelector.tsx`** — não importado
21. **Deletar `desdobramento/QuantidadeDezenasInput.tsx`** — não importado
22. **Deletar `desdobramento/FiltroPatternSelector.tsx`** — não importado
23. **Deletar `megasena/desdobramento/FiltroLinhasColunasMegaSena.tsx`** — já listado como unused
24. **Deletar `megasena/LoadingPalpiteIA.tsx`** — não importado

### Fase 4: Banco de Dados (1 item)
25. **Remover função `process_pending_bot_replies()`** — placeholder vazia sem uso

### Fora do escopo (manter)
- Componentes shadcn/ui — biblioteca reutilizável
- `og-post` edge function — usada para OG meta tags
- `useUserRole.ts` — wrapper de compatibilidade ainda importado
