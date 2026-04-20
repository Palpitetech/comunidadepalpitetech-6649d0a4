

# Refatorar Dashboard Admin em Blocos com Filtros Globais

## Objetivo
Transformar `/admin` numa central de métricas em blocos focados em decisão (vendas, ativos, vencidos, oportunidades), com filtro global de período e opção de filtro independente por bloco. Remover **Saúde dos Bots** e **Módulos** desta tela (continuam acessíveis pelo sidebar).

---

## Como o usuário vai ver

```text
┌─ Período Global: [Hoje][Ontem][7d][14d][21d][Mês passado][1m][2m][3m][📅 custom]  [⚙ Toggle: Global / Por Bloco] ┐
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────── BLOCO 01 — Funil de Aquisição ───────────────────────────────────────────────┐
│  [📈 Gráfico em linha — Cadastros / Verificados / Vendas (eixo tempo)]                                            │
│  Lógica: Cadastros = Leads + Vendas (sem duplicar). Ex: 100 cadastros = 60 leads + 40 vendas                      │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─ Total Vendas ──┐  ┌─ Total Cadastros ──┐  ┌─ Total Verificados ──┐
│   R$ 1.234     │  │       100           │  │        78            │
│   40 vendas    │  │  40 pagos · 60 leads│  │  78% do total        │
└────────────────┘  └─────────────────────┘  └──────────────────────┘

┌─ Contas Vencidas ┐  ┌─ Canceladas ───┐  ┌─ Ativas (Pago) ──┐  ┌─ Grupo VIP Lotofácil ┐
│      28         │  │  26 · X ativ. │  │  35 ativas       │  │      127 membros      │
│                 │  │       X inat. │  │  Mensal · Anual..│  │                       │
└─────────────────┘  └────────────────┘  └──────────────────┘  └───────────────────────┘

┌─ Trial Ativo ┐  ┌─ Trial Vencido ┐  ┌─ Total R$ Vendas ┐  ┌─ Oport. Vencidas R$ ┐  ┌─ PIX a Pagar R$ ┐
│      12      │  │       45        │  │    R$ 3.450      │  │      R$ 890         │  │    R$ 423        │
└──────────────┘  └─────────────────┘  └──────────────────┘  └─────────────────────┘  └──────────────────┘

┌─────────── Vendas por Plano (no período) ───────────┐
│  Mensal:        12 vendas  · R$ 564                  │
│  Semestral:      4 vendas  · R$ 268                  │
│  Anual:          2 vendas  · R$ 594                  │
│  Anual VIP:      1 venda   · R$ 397                  │
│  Grupo VIP Loto: 8 vendas  · R$ 152                  │
└──────────────────────────────────────────────────────┘
```

**Cada bloco** tem no canto superior direito:
- Quando filtro = **Global** → ícone discreto com período herdado
- Quando filtro = **Por Bloco** → mini seletor próprio (mesma lista de períodos)

---

## Definição precisa dos blocos (lógica)

| Bloco | Métrica | Fonte / Cálculo |
|---|---|---|
| **01 — Gráfico Funil** | Cadastros, Verificados, Vendas (linhas) | série diária baseada em `perfis.created_at` (cadastros), `perfis.email_verificado=true` (verificados), `kirvano_webhook_logs WHERE event='SALE_APPROVED'` (vendas) |
| **Total Vendas** | nº + R$ | `event='SALE_APPROVED' OR 'SUBSCRIPTION_RENEWED'` no período, soma `raw_payload->>'total_price'` (parse "R$ 47,00") |
| **Total Cadastros** | nº + breakdown | `perfis WHERE is_bot=false AND created_at NO PERÍODO`. Sub: pagos vs leads (regra: **se email do perfil existe em vendas aprovadas → pago**, senão lead) |
| **Total Verificados** | nº + % | `perfis WHERE email_verificado=true` no período |
| **Contas Vencidas** | nº | `perfis` com tag `plano_vencido` OU `validade_assinatura < now()` (não filtrado por período — é estado atual) |
| **Canceladas** | nº + ativ/inat | conta de eventos `SUBSCRIPTION_CANCELED` no período. Sub: usuário ainda tem acesso (validade futura) vs já não tem |
| **Ativas (Pago)** | nº + por plano | `perfis` com `plan_id` em planos pagos AND (`status_assinatura='ativa' OR validade_assinatura > now()`). Breakdown por `plan.name` (estado atual) |
| **Grupo VIP Lotofácil** | nº | `count(perfis WHERE 'integrante_grupo_lotofacil_vip' = ANY(tags))` (estado atual) |
| **Trial Ativo** | nº | `perfis WHERE plan_id = teste-gratis-3-dias AND validade_assinatura > now()` |
| **Trial Vencido** | nº | `perfis WHERE trial_used=true AND (plan_id IS NULL OR plan_id = teste-gratis OR validade < now())` |
| **Vendas por Plano** | lista | join `kirvano_webhook_logs` (SALE_APPROVED) → `kirvano_offer_plan_map.offer_id` → `plans` no período |
| **Total Vendas R$** | R$ | mesma origem do bloco "Total Vendas", apenas o valor |
| **Oport. Vencidas R$** | R$ | `event='PIX_EXPIRED' OR 'SUBSCRIPTION_EXPIRED'` no período, soma `total_price` |
| **PIX a Pagar R$** | R$ | `event='PIX_GENERATED' AND` ainda não tem `SALE_APPROVED` correspondente (mesmo `checkout_id`), soma `total_price` (estado atual) |

**Sugestões extras de métrica** (incluo no plano se aprovado):
- **Carrinho Abandonado**: `event='ABANDONED_CART'` no período (potencial de recuperação)
- **Renovações**: `event='SUBSCRIPTION_RENEWED'` no período (saúde da retenção)
- **Ticket médio**: `total R$ vendas / nº vendas` no período
- **% conversão lead→pago**: `pagos / cadastros * 100`

---

## Etapas de implementação

### Etapa 1 — Hook central de filtros + período
**Arquivo novo:** `src/hooks/useDashboardPeriod.ts`

- Tipo `PeriodKey = "today"|"yesterday"|"7d"|"14d"|"21d"|"last_month"|"1m"|"2m"|"3m"|"custom"`
- Função `resolvePeriod(key, customRange?) → { from: Date; to: Date; label: string }`
- Reutilizável em qualquer bloco

**Refator no fim da etapa:** garantir que `AdminMetricas.tsx` também possa adotar este hook depois (não muda agora, só prepara).

### Etapa 2 — Componente `<PeriodFilter />`
**Arquivo novo:** `src/components/admin/dashboard/PeriodFilter.tsx`

- Props: `value`, `onChange`, `customRange`, `onCustomRangeChange`, `compact?: boolean` (compact = usado dentro dos blocos)
- Renderiza pills de período + popover de calendário para `custom`
- Modo compact: dropdown simples ao invés de pills

### Etapa 3 — Hook de dados consolidado
**Arquivo novo:** `src/hooks/admin/useDashboardMetrics.ts`

- Recebe `period: { from, to }`
- Faz **uma única tanda paralela** de queries:
  1. `perfis` no período (cadastros + verificados)
  2. `perfis` estado atual (ativas, vencidas, trials, grupo VIP) — **não filtrado por período**
  3. `kirvano_webhook_logs` no período (vendas, PIX, cancelamentos, expirações)
  4. `kirvano_webhook_logs` estado atual de PIX pendente (sem aprovação correspondente)
  5. `plans` (para nomear breakdown)
  6. `kirvano_offer_plan_map` (para mapear vendas → plano)
- Retorna objeto tipado `DashboardMetrics` com todos os campos + série diária para o gráfico
- Helper interno `parseBrazilianCurrency("R$ 47,00") → 47.0`
- Helper `groupByDay(logs, dateField) → { date: string; count: number; sum?: number }[]`

### Etapa 4 — Componentes de bloco (atômicos, reutilizáveis)
**Arquivos novos em** `src/components/admin/dashboard/`:

- `MetricBlock.tsx` — wrapper genérico (título, valor grande, sub-info, ícone, slot de filtro próprio quando modo "por bloco")
- `FunnelChart.tsx` — gráfico de linha com Recharts (3 séries: cadastros, verificados, vendas)
- `PlanBreakdownBlock.tsx` — lista de "Plano X = Y vendas · R$ Z"

Cada `MetricBlock` aceita `localPeriod?: { from, to }` que sobrescreve o global quando modo "por bloco" estiver ativo.

### Etapa 5 — Reescrever `AdminIndex.tsx`
- **Remover** `BotHealthWidget` import e uso
- **Remover** seção "Módulos" e array `ADMIN_MODULES`
- **Manter** `UserStatsWidget` ou substituir pelo novo grid (decidir: novo grid cobre + bloco de cadastros já mostra a info → **remover** `UserStatsWidget` para evitar duplicação)
- Adicionar:
  - `<PeriodFilter />` global no topo
  - `<Switch>` "Filtro por bloco" (controla se cada bloco renderiza filtro próprio)
  - Grid responsivo de blocos (grid-cols-1 mobile, md:grid-cols-2, lg:grid-cols-3 / 4)
  - Bloco 01 ocupa largura total (lg:col-span-full)

### Etapa 6 — Limpeza / refatoração
- Apagar `BotHealthWidget.tsx` se não for usado em outro lugar (`code--search_files` confirma uso único em `AdminIndex`)
- Mover `UserStatsWidget` para arquivo próprio se ainda for útil em outra página, ou deletar
- Garantir que `AdminMetricas` continua funcionando (sem mudanças, apenas seu hook de período pode ser unificado depois)
- Rodar TypeScript check, remover imports não usados

### Etapa 7 — Validação end-to-end
1. Carregar `/admin` → vê filtro global + grid de blocos sem bots/módulos
2. Trocar filtro global "7d" → todos blocos filtráveis por período recalculam; blocos de "estado atual" (vencidas, ativas, trial, grupo VIP, PIX a pagar) **ignoram** o período (mostram badge "estado atual")
3. Ativar toggle "Por bloco" → cada bloco filtrável mostra mini seletor; blocos de "estado atual" não mostram (não faz sentido)
4. Conferir gráfico de funil: cadastros = pagos + leads (sem duplicação)
5. Conferir bloco "Vendas por Plano" cobre todos os planos com vendas no período
6. Mobile: grid colapsa para 1 coluna; gráfico responsivo

---

## Detalhes técnicos sensíveis

**Anti-duplicação no funil (regra crítica do usuário):**
```ts
const emailsComVendaAprovada = new Set(
  vendasAprovadas.map(v => v.email.toLowerCase())
);
const cadastrosNoPeriodo = perfisCriadosNoPeriodo.length;
const pagosNoPeriodo = perfisCriadosNoPeriodo.filter(
  p => emailsComVendaAprovada.has(p.email?.toLowerCase())
).length;
const leadsNoPeriodo = cadastrosNoPeriodo - pagosNoPeriodo;
// Total = cadastros (NÃO somar pagos+leads para evitar duplicar)
```

**PIX a pagar (estado atual):**
```ts
const pixGerados = logs.filter(l => l.event === 'PIX_GENERATED');
const checkoutsAprovados = new Set(
  logs.filter(l => l.event === 'SALE_APPROVED').map(l => l.checkout_id)
);
const pixAbertos = pixGerados.filter(p => 
  !checkoutsAprovados.has(p.checkout_id) &&
  parseDate(p.raw_payload?.payment?.expires_at) > now
);
```

**Parse de valor BR:**
```ts
function parseBRL(s?: string | null): number {
  if (!s) return 0;
  return parseFloat(s.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
}
```

**Distinção temporal vs estado:**
- "Por período": Cadastros, Verificados, Vendas, Canceladas, PIX gerado/expirado, Vendas por Plano, R$ Vendas, R$ Oport. Vencidas, Carrinho Abandonado
- "Estado atual" (ignora período): Ativas, Vencidas, Trial Ativo/Vencido, Grupo VIP Lotofácil, PIX a Pagar (em aberto)

---

## Arquivos resumo

| Arquivo | Ação |
|---|---|
| `src/hooks/useDashboardPeriod.ts` | **Novo** — hook de período + tipos |
| `src/hooks/admin/useDashboardMetrics.ts` | **Novo** — busca consolidada de todas métricas |
| `src/components/admin/dashboard/PeriodFilter.tsx` | **Novo** — pills + custom range |
| `src/components/admin/dashboard/MetricBlock.tsx` | **Novo** — wrapper de bloco |
| `src/components/admin/dashboard/FunnelChart.tsx` | **Novo** — gráfico Recharts |
| `src/components/admin/dashboard/PlanBreakdownBlock.tsx` | **Novo** — lista vendas por plano |
| `src/pages/admin/AdminIndex.tsx` | **Reescrever** — remover bots/módulos, novo grid |
| `src/components/admin/BotHealthWidget.tsx` | **Apagar** (após confirmar uso único) |

## Fora de escopo
- Mudanças no sidebar admin (Módulos continuam acessíveis lá)
- Página `/admin/metricas` (UTM) — fica como está
- Novas tabelas / migrations (toda métrica vem de tabelas existentes)
- Comparativo período-a-período (próximo ciclo, se quiser)

## Resultado esperado
- Dashboard limpa, focada em **decisão financeira** (vendas, ativas, oportunidades)
- Filtro global + override por bloco (UX flexível, único na ferramenta)
- Gráfico de funil com lógica anti-duplicação correta (60 leads + 40 vendas = 100 cadastros)
- Cobertura completa: 13 blocos + 4 métricas extras sugeridas
- Código modular: cada bloco é reutilizável em outras dashboards futuras

