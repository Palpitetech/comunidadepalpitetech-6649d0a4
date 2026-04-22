

# Métricas 100% — Atribuição UTM unificada com jornada Lead → Cadastro → Comprador

## Diagnóstico do estado atual

Hoje a página `/admin/metricas` tem **3 limitações graves**:

1. **Atribuição quebrada em `perfis`** — só 1 de 37 perfis tem `utm_source` (2,7% de cobertura). Cadastros via OTP não persistem UTM no momento da criação. Click IDs e demais UTMs (`utm_medium/campaign/content/term`, `gclid`, `fbclid`) **não existem em `perfis`**.
2. **Kirvano joga UTMs fora** — payload tem `utm.*` + `cookies.{gclid,fbclid,fbp,ttp}` em **57 vendas com UTM e 81 com clickID** (de 105 logs), mas **nada é extraído nem propagado**. Fica congelado em `raw_payload` jsonb.
3. **Sem jornada unificada** — lead em `leads_inbox`, cadastro em `perfis`, venda em `kirvano_webhook_logs`. Não há vínculo entre eles, então é impossível medir "tempo até primeira compra" ou "primeiro click → compra".

## O que vamos construir

### 1. Migration — coluna `attribution` jsonb única em `perfis`

Adicionar **uma coluna `attribution jsonb`** em `perfis` que armazena snapshot completo da primeira atribuição capturada:

```json
{
  "utm_source": "instagram", "utm_medium": "cpc", "utm_campaign": "...",
  "utm_content": "...", "utm_term": "...",
  "gclid": "...", "fbclid": "...", "fbp": "...",
  "referrer": "https://google.com/", "landing_page": "https://...",
  "first_click_at": "2026-01-15T10:00:00Z",
  "first_signup_at": "2026-01-16T14:00:00Z",
  "first_purchase_at": "2026-01-18T09:00:00Z",
  "lead_id": "uuid-do-leads_inbox-se-veio-de-lead"
}
```

Mantém `perfis.utm_source` por compat (é mirror de `attribution->>utm_source`).

Adicionar também:
- `perfis.first_purchase_at timestamptz` — data da 1ª compra confirmada
- Index GIN em `attribution` pra filtros rápidos
- Index btree em `(first_purchase_at)`

### 2. Função SQL `merge_user_attribution(user_id, new_attr jsonb)`

Faz **first-touch merge**: só preenche campos vazios em `perfis.attribution`. Usado pelos 3 pontos de entrada:
- Cadastro via OTP (frontend manda atribuição do localStorage)
- Promote de lead (copia atribuição do `leads_inbox`)
- Webhook Kirvano (extrai do `payload.utm` + `payload.cookies` quando cria/encontra usuário)

Atualiza também `perfis.utm_source` (mirror) e `first_purchase_at` quando aplicável.

### 3. Edge function `handle-kirvano-webhook` — extrair UTMs

Adicionar helper `pickAttribution(payload)`:
```ts
{
  utm_source: payload.utm?.utm_source || payload.utm?.src,
  utm_medium: payload.utm?.utm_medium,
  utm_campaign: payload.utm?.utm_campaign,
  utm_content: payload.utm?.utm_content,
  utm_term: payload.utm?.utm_term,
  gclid: payload.cookies?.gclid,
  fbclid: payload.cookies?.fbclid,
  fbp: payload.cookies?.fbp,
}
```

E chamar `merge_user_attribution(user_id, attr)` em todo `SALE_APPROVED`/`PIX_GENERATED`/`ABANDONED_CART` que cria ou encontra usuário. Quando `SALE_APPROVED`, também grava `first_purchase_at` (se nulo).

### 4. Edge function `receive-lead` — propagar para perfis

Quando lead vira usuário (promote), copiar `leads_inbox.{utm_*, gclid, fbclid, referrer, slug}` → `perfis.attribution` via `merge_user_attribution`. Se o usuário já existia, faz merge first-touch (não sobrescreve).

### 5. Frontend cadastro OTP — enviar atribuição

No `RegisterWizard` (cadastro manual), no momento que cria perfil, ler `getStoredAttribution()` e gravar em `perfis.attribution`. Hoje só passa `utm_source` no metadata.

### 6. Refatoração total da página `/admin/metricas`

Nova estrutura em **4 blocos**:

#### Bloco A — KPIs do período
Cards: Leads, Cadastros, Compradores, Vendas, Receita, **Conversão Lead→Cadastro**, **Conversão Cadastro→Compra**, **Ticket Médio**, **LTV médio em dias** (tempo médio cadastro → 1ª compra).

#### Bloco B — Tabela de Atribuição (filtrável)

**Dropdown "Dimensão"** com opções:
- `utm_source` (default)
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`
- `slug` (página)
- `referrer` (host)
- `gclid` (presente/ausente)
- `fbclid` (presente/ausente)

Tabela com colunas dinâmicas pela dimensão selecionada:

| Origem | Leads | Cadastros | Compradores | Vendas | Conv. C→P | Receita | Ticket Médio |
|---|---|---|---|---|---|---|---|
| instagram | 120 | 80 | 12 | 14 | 15% | R$ 1.400 | R$ 100 |
| (direto) | ... | ... | ... | ... | ... | ... | ... |

Sortable por qualquer coluna, exporta CSV.

#### Bloco C — Tabela de Compradores (LTV individual)

| Email | 1º Click | 1º Cadastro | 1ª Compra | Dias até comprar | Vendas | Receita Total | UTM Source | Campanha |
|---|---|---|---|---|---|---|---|---|
| joao@... | 12/01 | 14/01 | 16/01 | **4 dias** | 3 | R$ 297 | instagram | mega-julho |

Ordenável por "Dias até comprar" e "Receita Total". Export CSV. Filtro por intervalo de dias (≤7d, 8-30d, >30d).

#### Bloco D — Funil visual + Gerador de links (mantém o atual)

ASCII funil:
```text
Leads     ████████████████████ 120
Cadastros ████████████ 80 (66%)
Compradores ██ 12 (15%)
```

Gerador de links UTM (mantém intacto, só permite gerar todos os params, não só `utm`).

### 7. Hook novo `useAttributionMetrics(period, dimension)`

Centraliza toda a query: busca `leads_inbox`, `perfis`, `kirvano_webhook_logs` aprovados, junta por email/celular, calcula métricas agrupadas pela dimensão escolhida. Memoizado por período + dimensão.

## Detalhes técnicos

- **Fonte única de verdade da jornada**: chave de junção é `email lowercase` (já normalizado em todas as 3 tabelas). Quando `merge_user_attribution` roda, também atualiza `leads_inbox.perfil_id` se o lead casa por email/celular — fechando o vínculo.
- **First-touch puro**: nunca sobrescreve campos preenchidos. Última atribuição (ex: cliente clica Meta → compra direto) só preenche o que estava vazio.
- **Agrupamento por dimensão**: leads/cadastros/compradores podem ter atribuições diferentes — cada métrica usa a fonte correta:
  - **Leads** → `leads_inbox.{dimension}`
  - **Cadastros** → `perfis.attribution->>dimension`
  - **Compradores** → `perfis.attribution->>dimension` (perfil casado com venda aprovada)
  - **Receita** → soma de `kirvano_webhook_logs.raw_payload->>total_price` para vendas casadas com perfil
- **LTV em dias**: `perfis.first_purchase_at - perfis.created_at` (ou `attribution->>first_click_at` se disponível, senão fallback para `created_at`).
- **Performance**: queries usam paginação de 1000 e agregação client-side (volume baixo — 105 webhooks, 37 perfis hoje). Se crescer, criar view materializada `mv_user_journey`.

## Arquivos

| Arquivo | Ação |
|---|---|
| **Migration nova** | `perfis.attribution jsonb`, `perfis.first_purchase_at`, função `merge_user_attribution` |
| `supabase/functions/handle-kirvano-webhook/index.ts` | Adicionar `pickAttribution()` + chamar `merge_user_attribution` em SALE_APPROVED |
| `supabase/functions/receive-lead/index.ts` | Propagar atribuição completa para `merge_user_attribution` no promote |
| `supabase/functions/promote-lead-to-user/index.ts` | Idem |
| `src/components/auth/RegisterWizard.tsx` (ou equivalente OTP) | Enviar `getStoredAttribution()` no cadastro |
| `src/hooks/admin/useAttributionMetrics.ts` | **Novo** hook central de métricas |
| `src/pages/admin/AdminMetricas.tsx` | **Refatoração total** — 4 blocos novos |
| `src/components/admin/metricas/AttributionTable.tsx` | **Novo** — tabela filtrável por dimensão |
| `src/components/admin/metricas/BuyersLTVTable.tsx` | **Novo** — tabela de compradores |
| `src/components/admin/metricas/MetricsKPIs.tsx` | **Novo** — bloco de KPIs |
| `src/integrations/supabase/types.ts` | Auto-regen pelo Supabase após migration |

## Fora de escopo

- Migrar dados históricos de `kirvano_webhook_logs.raw_payload` para `perfis.attribution` (cron job pontual). Posso fazer um script SQL one-shot **separado** se quiser, mas não na mesma iteração.
- Multi-touch attribution (last-click, linear, time-decay) — fica first-touch puro por enquanto.
- Dashboard de retenção / cohort.
- Integrar com Google Analytics ou Meta Pixel pra cross-check.

## Resultado esperado

- Toda venda Kirvano com UTM/clickID **vira métrica filtrável** automaticamente
- Dashboard responde "qual UTM converte mais e em quantos dias" em tempo real
- Tabela de compradores mostra **LTV individual** (dias até comprar + receita total)
- Mesma dimensão (ex: `utm_campaign=mega-julho`) é comparável entre Leads, Cadastros e Compradores
- Histórico de jornada preservado em **uma única coluna jsonb** em `perfis`
- Cobertura de atribuição salta de 2,7% para **>80%** dos perfis novos em 30 dias

