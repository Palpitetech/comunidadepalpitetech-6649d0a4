

## Refatoração: limpar legado e modularizar `group-blast-send`

### Diagnóstico do estado atual

Após as 4 evoluções recentes (fix Bad Request → fallback ao vivo → IA estruturada), `group-blast-send/index.ts` tem **840 linhas** misturando 5 responsabilidades em um único arquivo. Identifiquei **3 problemas reais de manutenção**:

#### 1. Edge legacy `group-blast` (863 linhas) ainda em produção
- Frontend (`DisparoGrupoTab.tsx`) ainda invoca `supabase.functions.invoke("group-blast", ...)` para **2 ações ativas**: `prepare` (botão "Disparar/Test") e `send_now` (botão "Disparar agora").
- A versão legacy tem o `sleep(60_000)` problemático, sem fallback, sem IA estruturada — ou seja, **toda vez que admin clica "Disparar"**, cai no fluxo antigo.
- Tem `handleSendNow` que **só** existe na legacy — `group-blast-send` nunca a portou.

#### 2. Duplicação total de `prepare` entre as duas edges
- Lógica idêntica de cálculo de slot, BRT→UTC, dedup, update de `last_scheduled_index`. A única divergência é o `force` (legacy aceita; nova ignora).

#### 3. Monolito difícil de navegar
- `index.ts` (840 linhas) mistura: HTTP handler, prepare, send (com 200 linhas), validador IA, gerador IA (~100 linhas), gerador palpite Lotofácil (~300 linhas).
- Constantes (`HOOK_EMOJI_MAP`, `PERIODO_ANALISE`) espalhadas no meio da lógica.
- Sem reuso do `_shared/whatsapp-utils.ts` que já tem `corsHeaders`, `getServiceRoleClient`, `getEvolutionEnv`, `jsonResponse`.

### O que vai mudar

**Estrutura final:**

```text
supabase/functions/
├── _shared/
│   ├── whatsapp-utils.ts          (já existe — passa a ser usado)
│   └── group-blast/                (NOVO)
│       ├── prepare.ts              (handlePrepare extraído + unificado)
│       ├── send.ts                 (handleSend + loop fallback)
│       ├── send-now.ts             (handleSendNow portado da legacy)
│       ├── ai-message.ts           (generateAIMessage + validação + emoji map)
│       └── palpite-message.ts      (generatePalpiteMessage Lotofácil)
└── group-blast-send/
    └── index.ts                    (~70 linhas — só roteamento HTTP)
```

**Edge `group-blast` (legacy):** removida via `delete_edge_functions` após repontar o frontend.

### Mudanças por arquivo

#### 1. `supabase/functions/_shared/group-blast/prepare.ts` (novo)
- Extrai `handlePrepare` do atual `group-blast-send/index.ts`.
- Aceita parâmetro opcional `force?: boolean` (do legacy): quando `true`, agenda em `Date.now() + 30s * (slotIdx+1)` e pula o dedup. Resolve a unificação dos 2 prepares.
- Remove duplicação BRT→UTC: helper interno `brTimeToUtcToday(hh, mm)`.

#### 2. `supabase/functions/_shared/group-blast/send.ts` (novo)
- Extrai `handleSend` (loop de fallback ao vivo, validação de mensagem vazia, telemetria `tried[]`).
- Extrai sub-helper `resolveMessageContent(supabase, log, slot, configData, apiKey, baseUrl)` que retorna `{ messageContent, source }` — hoje esse bloco mora inline com 50 linhas no meio do loop.
- Extrai sub-helper `attemptSendThroughInstance(instance, evolutionUrl, evolutionKey, log, messageContent)` retornando `{ ok, error?, status? }` — substitui as ~80 linhas de connectionState + sendText + cooldown.

#### 3. `supabase/functions/_shared/group-blast/send-now.ts` (novo)
- Porta o `handleSendNow` da legacy (insere logs com `scheduled_for = now + 5s` e retorna IDs).
- Mantém compatibilidade: mesma assinatura de retorno (`{ success, log_ids, groups_count, scheduled_for, message }`) que o frontend já espera.

#### 4. `supabase/functions/_shared/group-blast/ai-message.ts` (novo)
- Move `HOOK_EMOJI_MAP`, `pickHookEmoji`, `validateAIMessage`, `generateAIMessage`.
- Sem mudança de comportamento — apenas isolamento.

#### 5. `supabase/functions/_shared/group-blast/palpite-message.ts` (novo)
- Move `PERIODO_ANALISE`, `generatePalpiteMessage` (Lotofácil).
- Sem mudança de comportamento.

#### 6. `supabase/functions/group-blast-send/index.ts` (refatorado, ~70 linhas)
- Só roteamento HTTP + validação de env vars.
- Aceita `action: "prepare" | "send" | "send_now"` (este último portado).
- Usa `corsHeaders` e `jsonResponse` do `_shared/whatsapp-utils.ts` (elimina duplicação).
- Validação JWT admin para `send_now` e `prepare` (action manual); `send` (cron) continua sem auth.

```ts
// Esqueleto final
import { corsHeaders, jsonResponse, getServiceRoleClient, getEvolutionEnv, validateAdmin } from "../_shared/whatsapp-utils.ts";
import { handlePrepare } from "../_shared/group-blast/prepare.ts";
import { handleSend } from "../_shared/group-blast/send.ts";
import { handleSendNow } from "../_shared/group-blast/send-now.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const evo = getEvolutionEnv();
  if (!evo) return jsonResponse({ error: "Evolution API não configurada" }, 500);
  const supabase = getServiceRoleClient();

  const body = await req.json().catch(() => ({}));
  const action = body?.action ?? "send";

  // send é chamada pelo cron (sem auth); demais ações são admin-only
  if (action !== "send") {
    const authErr = await validateAdmin(req);
    if (authErr) return authErr;
  }

  if (action === "prepare")  return handlePrepare(supabase, body);
  if (action === "send_now") return handleSendNow(supabase, body.config_id, body.slot_id);
  return handleSend(supabase, evo.url, evo.key);
});
```

#### 7. `src/components/admin/whatsapp/DisparoGrupoTab.tsx`
- Trocar `invoke("group-blast", ...)` → `invoke("group-blast-send", ...)` nos 2 pontos (`handleTest` linha 303, `handleSendNow` linha 316).
- Sem mudança nos payloads; nomes de actions iguais.

#### 8. Remover `supabase/functions/group-blast/` 
- Após confirmar que o frontend já não chama mais, deletar via `delete_edge_functions`.
- Nenhuma migration depende dela; nenhuma DB function a invoca.

### Garantias

- **Zero mudança de comportamento funcional**: a refatoração preserva exatamente fallback ao vivo, validação de mensagem vazia, IA estruturada, telemetria `tried[]`.
- **Cron continua intacto**: já chama `group-blast-send` (default action `send`) — não muda.
- **Frontend ganha as melhorias**: ao migrar para `group-blast-send`, o botão "Disparar" passa a usar o fluxo novo (com fallback, sem `sleep(60s)`).
- **Compatibilidade com `send_now`**: portada com mesma assinatura — frontend não precisa mudar payload.
- **Reuso de utilitários**: `corsHeaders`/`jsonResponse`/`validateAdmin` saem do `_shared/whatsapp-utils.ts` em vez de redefinidos.
- **Tamanho de cada arquivo após refatoração**:
  - `index.ts`: ~70 linhas
  - `prepare.ts`: ~110 linhas
  - `send.ts`: ~200 linhas (com sub-helpers)
  - `send-now.ts`: ~60 linhas
  - `ai-message.ts`: ~140 linhas
  - `palpite-message.ts`: ~290 linhas
- **Testabilidade**: cada módulo isolado pode receber testes Deno futuramente sem mocks complexos.

### Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Frontend chamar `group-blast` durante o deploy | Deletar a edge **depois** de fazer deploy do `DisparoGrupoTab.tsx` repontado. |
| Imports de `_shared` quebrarem em Deno | Padrão já usado por `_shared/whatsapp-utils.ts` — confirma compatibilidade. |
| `validateAdmin` quebrar `send_now` se chamado por cron | `send_now` é só admin (botão UI); cron usa `send` que pula auth. |

### Não inclui (escopo separado, se quiser depois)

- Tipagem forte (substituir `any` por tipos do `database.types.ts`).
- Testes Deno automatizados.
- Métricas de custo IA (cost_usd hoje neutro).
- Configurar tom de mensagem por config (`ai_tone` em `group_blast_configs`).

