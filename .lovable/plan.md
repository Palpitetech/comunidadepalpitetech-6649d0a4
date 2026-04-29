
# Refatoração da tela de Eventos

## Diagnóstico (por que faltava PIX gerado)

A tabela `events` deveria ser **fonte única de verdade** (append-only), mas hoje:

- O `insertEvent` no webhook da Kirvano só grava se já existir um `perfis` com aquele email (`ilike(email)`). Como PIX/Carrinho geralmente vêm antes do cadastro, **o evento nunca é registrado**.
- `events.user_id` é `NOT NULL` → não dá para registrar eventos de leads/visitantes anônimos (PIX gerado por quem ainda não tem conta).
- Eventos `SUBSCRIPTION_RENEWED` da Kirvano caem em `missing_offer_id` e nunca chegam a `events`.
- `insertEvent` mistura duas responsabilidades: registrar log + alterar tags do perfil. Isso "cheira" a update e dificulta entender que é append-only.
- A UI tem só 4 tipos por aba e não cobre `sale_confirmed`, `assinatura_renovada`, `assinatura_expirada`, `reembolso`, `chargeback`, `lead_*`, etc.

---

## Etapa 1 — Garantir que TODO evento da Kirvano vire uma linha em `events`

### 1.1 — Permitir eventos sem `user_id` (leads anônimos)

- Migration: tornar `events.user_id` **nullable** e adicionar colunas opcionais para identificar leads sem conta:
  - `lead_email text`, `lead_phone text`, `source text default 'system'` (`'kirvano' | 'lead_webhook' | 'system'`).
- Adicionar índice `(event_type, created_at desc)` e `(lead_email)`.
- RLS: manter "admins leem tudo"; `service_role` insere.

### 1.2 — Centralizar a gravação do evento da Kirvano

- Criar helper `insertKirvanoEvent(eventType, { email, phone, userId, metadata })` em `handle-kirvano-webhook` que:
  - **Sempre** insere em `events`, com `user_id` se existir perfil, senão grava só `lead_email`/`lead_phone`.
  - Nunca mais retorna em silêncio quando perfil não existe.

### 1.3 — Mover gestão de tags para fora do `insertEvent`

- Criar função separada `applyKirvanoTags(userId, eventType, meta)` chamada **só** quando há `userId`.
- `insertKirvanoEvent` passa a fazer apenas o log (append-only).

### 1.4 — Cobrir todos os eventos do payload Kirvano

Hoje o webhook só mapeia 6 tipos. Adicionar mapeamento completo:

| Kirvano (`event`)           | `event_type` na tabela    |
|-----------------------------|---------------------------|
| `SALE_APPROVED`             | `compra_aprovada`         |
| `SALE_REFUNDED`             | `compra_reembolsada`      |
| `SALE_CHARGEBACK`           | `compra_chargeback`       |
| `SUBSCRIPTION_RENEWED`      | `assinatura_renovada`     |
| `SUBSCRIPTION_CANCELED`     | `assinatura_cancelada`    |
| `SUBSCRIPTION_EXPIRED`      | `assinatura_expirada`     |
| `SUBSCRIPTION_OVERDUE`      | `assinatura_inadimplente` |
| `PIX_GENERATED`             | `pix_gerado`              |
| `PIX_EXPIRED`               | `pix_expirado`            |
| `BANK_SLIP_GENERATED`       | `boleto_gerado`           |
| `BANK_SLIP_EXPIRED`         | `boleto_expirado`         |
| `ABANDONED_CART`            | `carrinho_abandonado`     |
| `CHECKOUT_ABANDONED`        | `checkout_abandonado`     |

### 1.5 — Remover o `return` cedo no fluxo "ignore"

- O bloco `if (action === "ignore")` hoje grava evento condicionalmente. Refatorar para que a chamada a `insertKirvanoEvent` aconteça **sempre, no início**, antes de qualquer decisão de "ignorar" ou "ativar".

### 1.6 — Padronizar o `metadata` por tipo

Cada tipo grava um JSON consistente, sem campos faltando. Exemplo:

- `pix_gerado`: `{ payment_method, total_price, pix_codigo, pix_expires_at, plan_slug, offer_id, sale_id }`
- `compra_aprovada`: `{ payment_method, total_price, plan_slug, offer_id, sale_id, validade_assinatura }`
- `assinatura_renovada` / `assinatura_expirada` / `assinatura_inadimplente`: `{ plan_slug, offer_id, validade_assinatura }`
- `carrinho_abandonado` / `checkout_abandonado`: `{ checkout_id, total_price, plan_slug }`

---

## Etapa 2 — Reforçar append-only nos eventos do sistema

### 2.1 — Auditar todos os pontos que escrevem em `events`

Locais identificados:
- `handle-subscription-expiration` → `assinatura_expirada`
- `promote-lead-to-user` → `lead_inbox_promovido`
- `receive-lead` → `lead_bloqueado_validacao`, `lead_inbox_capturado`, `email_pendente_criado`, `lead_recebido_pendente`, `lead_tag_*`
- `Cadastro.tsx` (frontend) → `novo_cadastro`

Confirmar que **todos** fazem `insert` (nunca `upsert`/`update`).

### 2.2 — Padronizar `source` nos inserts do sistema

- Adicionar `source: 'system'` ou `'lead_webhook'` no metadata para diferenciar de Kirvano na UI.

### 2.3 — Garantir que `novo_cadastro` (frontend) sempre grava

- Hoje o insert vem de `Cadastro.tsx` com `auth.uid()`. Verificar que a RLS authenticated permite e que falhas não silenciam.

---

## Etapa 3 — Refatoração da UI `AdminEventos.tsx`

### 3.1 — Atualizar tipagem e dicionário de tipos

Adicionar configs (label + ícone + cor) para os tipos que faltam:
- `sale_confirmed`, `compra_reembolsada`, `compra_chargeback`
- `assinatura_renovada`, `assinatura_expirada`
- `lead_inbox_capturado`, `lead_inbox_promovido`, `lead_email_confirmado`, `lead_recebido_pendente`, `email_pendente_criado`
- `trial_revertido_bug` (bucket "Sistema")

### 3.2 — Reorganizar abas (filtros)

Trocar as 4 abas atuais por 6, baseadas no funil real:

| Aba           | Tipos                                                                 |
|---------------|-----------------------------------------------------------------------|
| Todos         | —                                                                     |
| Leads         | `lead_inbox_capturado`, `lead_inbox_promovido`, `email_pendente_criado`, `lead_email_confirmado` |
| Cadastros     | `novo_cadastro`                                                       |
| PIX/Boleto    | `pix_gerado`, `pix_expirado`, `boleto_gerado`, `boleto_expirado`, `carrinho_abandonado`, `checkout_abandonado` |
| Vendas        | `compra_aprovada`, `sale_confirmed`, `assinatura_renovada`, `compra_reembolsada`, `compra_chargeback` |
| Cancelamentos | `assinatura_cancelada`, `assinatura_inadimplente`, `assinatura_expirada` |

### 3.3 — Coluna "Detalhe" inteligente por tipo

Substituir o `getMetaSummary` genérico por um renderizador por tipo:
- `pix_gerado`: mostra `R$ valor • plano_slug`
- `compra_aprovada`: `R$ valor • plano_slug • método`
- `assinatura_renovada/expirada`: `plano_slug • validade`
- `carrinho_abandonado`: `R$ valor • plano_slug`
- `lead_*`: `webhook_name` ou `pagina_origem`

### 3.4 — Sheet de detalhes mais completo

No painel lateral, exibir por tipo:
- Cabeçalho: ícone grande + label + data + origem (Kirvano/Sistema/Lead).
- Bloco "Identificação": nome+email do perfil **ou** `lead_email`/`lead_phone` quando não houver perfil.
- Bloco "Dados do evento": campos principais formatados (valor em R$, plano, oferta, sale_id, link Kirvano se aplicável).
- Bloco "JSON bruto" recolhível (mantém `<pre>` atual).

### 3.5 — Performance + paginação server-side

Hoje carrega 500 linhas e filtra no cliente. Refatorar:
- Buscar com `range()` paginado server-side baseado em `activeFilter` (lista de `event_type` no `.in()`) e `search` (ilike em perfil/email).
- Manter `PAGE_SIZE = 25`. Mostrar "Carregando…" só na troca de página/filtro.

### 3.6 — Indicação visual de "lead sem conta"

Quando o evento não tem `user_id`, exibir badge cinza "Lead" no lugar de avatar/nome, e mostrar `lead_email` no campo Email.

### 3.7 — Remover stats que enganam

O contador `total = events.length` mostrava só os 500 carregados. Trocar por `count` server-side por aba (`select count exact head: true`).

---

## Detalhes técnicos

### Migration esperada
```sql
ALTER TABLE public.events
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS lead_email text,
  ADD COLUMN IF NOT EXISTS lead_phone text,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'system';

CREATE INDEX IF NOT EXISTS idx_events_type_created
  ON public.events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_lead_email
  ON public.events(lead_email) WHERE lead_email IS NOT NULL;
```

### Helper na edge `handle-kirvano-webhook`
```ts
async function insertKirvanoEvent(
  admin: any,
  eventType: string,
  args: { userId?: string|null; email?: string|null; phone?: string|null; meta?: Record<string,any> }
) {
  await admin.from("events").insert({
    user_id: args.userId ?? null,
    lead_email: args.userId ? null : args.email ?? null,
    lead_phone: args.userId ? null : args.phone ?? null,
    event_type: eventType,
    source: "kirvano",
    metadata: { ...(args.meta ?? {}), webhook_event: eventName, email: args.email ?? null },
  });
}
```

### Garantia append-only
- Nenhum `upsert`/`update` em `events` em todo o código (validar com `rg "from\\(['\"]events['\"]\\).*(upsert|update)"`).
- RLS continua bloqueando UPDATE/DELETE para usuários autenticados.

### Arquivos afetados
- `supabase/migrations/<novo>.sql` (Etapa 1.1)
- `supabase/functions/handle-kirvano-webhook/index.ts` (Etapas 1.2 → 1.6)
- `supabase/functions/handle-subscription-expiration/index.ts` (Etapa 2.2)
- `supabase/functions/receive-lead/index.ts` (Etapa 2.2)
- `supabase/functions/promote-lead-to-user/index.ts` (Etapa 2.2)
- `src/pages/admin/AdminEventos.tsx` (Etapas 3.1 → 3.7)
- `src/lib/whatsapp-event-labels.ts` (sincronizar novos labels — opcional)

### Compatibilidade
- Eventos antigos não têm `source`/`lead_email` → default `'system'` cobre.
- Sem breaking change em `useDisparoManual` (continua usando `event_type` distintos).
