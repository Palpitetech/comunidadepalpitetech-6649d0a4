

# Tabela "First-Click vs Last-Click" — Atribuição comparativa de vendas

## O que é "primeiro click" e "último click" no nosso sistema

| Conceito | Fonte do dado | Quando é capturado |
|---|---|---|
| **First-click** (1º click) | `perfis.attribution` (first-touch via `merge_user_attribution`) | No primeiro contato — lead, cadastro OTP ou primeira venda Kirvano. Nunca sobrescrito. |
| **Last-click** (último click) | `kirvano_webhook_logs.raw_payload.utm` + `.cookies` da venda específica | Em **cada venda aprovada** — UTMs do checkout naquele momento. |

Quando o cliente clica no Instagram → cadastra → 30 dias depois clica no Google Ads → compra:
- **First-click** = `instagram` (ganha o crédito quem **trouxe** o lead)
- **Last-click** = `google` (ganha o crédito quem **fechou** a venda)

## Estado atual dos dados

- **17 vendas aprovadas** no histórico, **10 com UTM** populado no payload Kirvano (= 59% têm last-click rastreável)
- **0 perfis com `attribution` populado** ainda — o sistema novo só começa a coletar agora. First-click vai aparecer pra cadastros novos. Para histórico, vai depender de backfill (fora de escopo deste plano).

## A nova tabela: "Comparativo First-Click vs Last-Click"

Aparece **abaixo** da tabela "Compradores · LTV individual" em `/admin/metricas`.

### Estrutura

**Toggle no topo da tabela:**
- `Dimensão:` dropdown com `utm_source` (default), `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- `Modelo:` 3 botões — `First-Click` | `Last-Click` | `Comparar lado a lado`

### Modo "First-Click" e "Last-Click" (single)

| Origem | Vendas | Compradores únicos | Receita | Ticket Médio | % do total |
|---|---|---|---|---|---|
| FB | 8 | 7 | R$ 792 | R$ 99 | 47% |
| google | 2 | 2 | R$ 198 | R$ 99 | 12% |
| (sem atribuição) | 7 | 6 | R$ 693 | R$ 99 | 41% |

Sortable, exporta CSV.

### Modo "Comparar lado a lado" (o mais valioso)

| Origem | Vendas (1º click) | Receita (1º click) | Vendas (último click) | Receita (último click) | Δ Vendas | Δ Receita |
|---|---|---|---|---|---|---|
| FB | 5 | R$ 495 | 8 | R$ 792 | **+3** | **+R$ 297** |
| google | 3 | R$ 297 | 2 | R$ 198 | -1 | -R$ 99 |
| instagram_organico | 2 | R$ 198 | 0 | R$ 0 | -2 | -R$ 198 |

**Como ler:**
- `Δ positivo` na coluna last-click = canal que **fecha** vendas (bottom-funnel: Google Ads, retargeting)
- `Δ positivo` na coluna first-click = canal que **traz** o cliente (top-funnel: Instagram orgânico, indicação)
- Permite ver: "Instagram orgânico trouxe 2 leads que viraram compradores, mas todos fecharam clicando depois no Facebook"

### KPI cards no topo da nova seção

- **Vendas com first-click rastreado:** X de Y (Z%)
- **Vendas com last-click rastreado:** X de Y (Z%)
- **Vendas com mesmo canal first=last:** X (loyalty / single-touch)
- **Vendas com canal divergente:** X (multi-touch reattribution)

## Lógica de cálculo (frontend, no hook)

Para **cada venda aprovada do período**:

1. **Last-click** = ler `raw_payload.utm.{dimension}` da própria venda. Se vazio, marca `(sem atribuição)`.
2. **First-click** = procurar perfil pelo email da venda → ler `perfis.attribution->>{dimension}`. Se vazio ou perfil não casa, marca `(sem atribuição)`.
3. Agregar por `dimension value` em dois mapas paralelos (`firstClickMap`, `lastClickMap`).
4. Para o modo "Comparar", fazer merge dos dois mapas pegando todas as chaves únicas.

Receita lida de `raw_payload.total_price` (helper `parseBRL` já existe no hook).

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/hooks/admin/useAttributionMetrics.ts` | Estender retorno: adicionar `firstClickRows`, `lastClickRows`, `comparisonRows`, e KPIs `vendasComFirstClick`, `vendasComLastClick`, `vendasMesmoCanal`, `vendasCanalDivergente`. |
| `src/components/admin/metricas/FirstVsLastClickTable.tsx` | **Novo** componente — toggle de dimensão + modelo, renderiza 1 das 3 visualizações, exporta CSV. |
| `src/pages/admin/AdminMetricas.tsx` | Adicionar `<FirstVsLastClickTable data={data} />` logo abaixo de `<BuyersLTVTable />`. |

## Detalhes técnicos

- **Sem nova migration nem nova query** — usa exatamente os mesmos 3 fetches que `useAttributionMetrics` já faz hoje (`leads_inbox`, `perfis`, `kirvano_webhook_logs`).
- **Performance**: só agrega client-side em cima dos dados já buscados. Custo zero adicional.
- **Janela de período**: usa o mesmo `period` global da página — vendas filtradas por `received_at` dentro do range, igual ao resto.
- **Casamento email**: lowercase + trim, mesma normalização já usada no `vendasByEmail`.
- **Tratamento "(sem atribuição)"**: vendas sem UTM no payload OU perfil sem `attribution` aparecem agrupadas em uma linha separada — importante pra mostrar o tamanho real do "buraco" de atribuição.

## Resultado esperado

- Em uma única tela vê: "Quem trouxe o cliente?" (first) vs "Quem fechou a venda?" (last)
- Identifica canais sub-creditados (top-funnel orgânico que só aparece no first-click)
- Identifica canais super-creditados (Google Ads de marca que só aparece no last-click)
- Quantifica o gap de atribuição (quantas vendas estão sem UTM em cada modelo)
- Exporta CSV pra análise externa

## Fora de escopo

- Modelos multi-touch (linear, time-decay, U-shape) — fica só first vs last
- Backfill de `perfis.attribution` a partir do histórico de `kirvano_webhook_logs` (precisa de plano separado)
- Atribuição cross-device / cross-session via fingerprint
- Comparação com Google Analytics ou Meta Events Manager

