## Objetivo

No painel `/admin/metricas`, oferecer **dois níveis de filtro de período**:

1. **Global** (já existe no topo) — define o período padrão de todos os blocos.
2. **Por tabela** (novo) — cada tabela pode ter seu próprio período, sobrescrevendo o global. Útil para comparar, por exemplo, "Compradores dos últimos 30 dias" enquanto a Atribuição mostra "Hoje".

Opções disponíveis em todos os filtros (já existem em `PERIOD_OPTIONS`):
Hoje · Ontem · 7 dias · 14 dias · 21 dias · 1 mês · Mês passado · 2 meses · 3 meses · Personalizado.

## Mudanças

### 1. Padronizar o filtro global (topo da página)
- Substituir os botões inline atuais em `src/pages/admin/AdminMetricas.tsx` pelo componente reutilizável `PeriodFilter` (já existe em `src/components/admin/dashboard/PeriodFilter.tsx`), que já tem dropdown + calendário e cobre todas as opções pedidas.
- Mantém o range atual exibido ao lado ("dd/MM/yy – dd/MM/yy").

### 2. Filtro por tabela (override local)
Cada um destes blocos ganha um `PeriodFilter` próprio no header, ao lado do título/ações:
- `MetricsKPIs` (KPIs do topo)
- `AttributionTable` (Atribuição por origem)
- `BuyersLTVTable` (Compradores · LTV)
- `FirstVsLastClickTable` (First vs Last click)
- Card "Funil do período"

Comportamento:
- Estado inicial de cada tabela = "seguir global" (sem override).
- Quando o usuário escolhe um período local, aparece um chip "↻ Seguir global" para resetar.
- Quando "seguindo global", mudar o filtro global atualiza todas as tabelas automaticamente.

### 3. Buscar dados por período independente
O hook `useAttributionMetrics(period, dimension)` já recebe `PeriodRange`. Para suportar períodos diferentes por tabela sem refetch desnecessário:

- Criar **um único hook agregador** `useMetricsData({ globalPeriod, kpisPeriod?, attributionPeriod?, buyersPeriod?, clickPeriod? })` que internamente usa `useAttributionMetrics` em paralelo (uma chamada por período distinto, deduplicado por chave ISO from-to). React Query cuida de cache.
- Cada bloco recebe seu próprio `data` derivado.
- Quando todos os overrides são iguais ao global → 1 única query (caso comum, sem custo extra).

### 4. Persistência leve
Os overrides por tabela ficam em estado local (não persistem entre navegações). O período global continua só em memória, como hoje.

## Arquivos afetados

- `src/pages/admin/AdminMetricas.tsx` — usa `PeriodFilter` no topo, gerencia estado de overrides, passa períodos para cada bloco.
- `src/components/admin/metricas/MetricsKPIs.tsx` — recebe `period` + `onPeriodChange` opcionais e renderiza `PeriodFilter` no header.
- `src/components/admin/metricas/AttributionTable.tsx` — idem.
- `src/components/admin/metricas/BuyersLTVTable.tsx` — idem.
- `src/components/admin/metricas/FirstVsLastClickTable.tsx` — idem.
- `src/hooks/admin/useMetricsData.ts` *(novo)* — agregador com dedupe de queries.
- `src/components/admin/dashboard/PeriodFilter.tsx` — sem mudanças (já cobre todas as opções).

## Layout

```text
┌──────────────────────────────────────────────────┐
│ [Auditoria]                       [⏱ 7 dias ▾]   │  ← Global
├──────────────────────────────────────────────────┤
│ KPIs                              [⏱ Hoje ▾] [↻] │  ← override
│ ┌─────┐┌─────┐┌─────┐┌─────┐                    │
├──────────────────────────────────────────────────┤
│ Atribuição por origem  [Dim ▾] [⏱ 7d ▾] [CSV]   │
│ ...                                              │
├──────────────────────────────────────────────────┤
│ Compradores LTV     [≤7d|8-30|...] [⏱ 1m ▾][CSV]│
│ ...                                              │
├──────────────────────────────────────────────────┤
│ First vs Last click            [⏱ 14d ▾]         │
└──────────────────────────────────────────────────┘
```

## Fora do escopo

- Não altera lógica de cálculo do hook nem o schema do banco.
- Não persiste overrides entre sessões.
