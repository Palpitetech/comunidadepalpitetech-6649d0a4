
# Plano de Robustez — Módulo Disparo em Grupo

Princípio: o fluxo normal nunca para por causa de uma falha. Falhas ficam visíveis no painel com ação manual. Sem alertas externos, sem retry automático complexo.

---

## 1. Migração de banco

**Arquivo:** nova migração SQL.

### 1a. Colunas de retry em `group_blast_logs`
```sql
ALTER TABLE public.group_blast_logs
  ADD COLUMN retry_count int NOT NULL DEFAULT 0,
  ADD COLUMN last_error_at timestamptz;
```

### 1b. Tabela de auditoria do prepare
```sql
CREATE TABLE public.group_blast_prepare_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at timestamptz NOT NULL DEFAULT now(),
  config_id uuid REFERENCES public.group_blast_configs(id) ON DELETE SET NULL,
  slots_scheduled int NOT NULL DEFAULT 0,
  skipped_dedup int NOT NULL DEFAULT 0,
  error_message text
);

ALTER TABLE public.group_blast_prepare_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins acesso total prepare_runs"
  ON public.group_blast_prepare_runs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role acesso total prepare_runs"
  ON public.group_blast_prepare_runs FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_group_blast_prepare_runs_ran_at
  ON public.group_blast_prepare_runs (ran_at DESC);
```

---

## 2. Refatoração do `send.ts`

**Arquivo:** `supabase/functions/_shared/group-blast/send.ts`

Quebra o `handleSend` em funções pequenas e testáveis, **sem mudar comportamento de runtime** (exceto pela tolerância de 10min descrita no item 3):

- `fetchPendingLogs(supabase)` — busca até 5 logs `pending` com `scheduled_for <= now`.
- `selectInstancesForGroup(supabase, groupJid)` — encapsula RPC `select_best_instances`.
- `dispatchToEvolution(instance, log, content, evolutionUrl, evolutionKey)` — só HTTP + state-check (mantém `attemptSendThroughInstance` atual, renomeado).
- `markLogSuccess(supabase, log, instance, content, tried)` — update + `register_instance_usage`.
- `markLogFailed(supabase, log, reason)` — update status `failed` + incrementa `retry_count` quando aplicável + `last_error_at = now()`.
- `handleSend(...)` — orquestra os 4 acima.

Persiste `message_content` e `instance_id` mesmo nos `failed` quando já tinham sido resolvidos (essencial para o retry não recalcular IA).

---

## 3. Tolerância de 10 min em `send.ts`

Quando `select_best_instances` não retorna candidatas:

```ts
const isExpired =
  new Date(log.scheduled_for).getTime() < Date.now() - 10 * 60 * 1000;

if (!candidates || candidates.length === 0) {
  if (isExpired) {
    await markLogFailed(supabase, log, "Nenhuma instância disponível (expirado)");
    failed++;
  } else {
    // mantém pending, próximo ciclo do cron tenta de novo
    skippedCooldown++;
    console.log(`[send] log=${log.id} sem instância — mantém pending (dentro da janela de 10min)`);
  }
  continue;
}
```

Isso resolve cooldown temporário sem precisar de retry automático complexo. Não muda nada no slot/rotação/dedup.

---

## 4. Auditoria no `prepare.ts`

**Arquivo:** `supabase/functions/_shared/group-blast/prepare.ts`

Ao final do loop por config, inserir em `group_blast_prepare_runs`:

```ts
await supabase.from("group_blast_prepare_runs").insert({
  config_id: config.id,
  slots_scheduled: insertedForThisConfig,
  skipped_dedup: skippedForThisConfig,
  error_message: errorsForThisConfig.length > 0 ? errorsForThisConfig.join(" | ") : null,
});
```

Garante visibilidade de prepares que rodaram sem inserir nada (logs de Edge Function somem com o tempo).

---

## 5. Nova função compartilhada `retry.ts`

**Arquivo:** `supabase/functions/_shared/group-blast/retry.ts` (novo)

```ts
export async function handleRetry(
  supabase: any,
  evolutionUrl: string,
  evolutionKey: string,
  logId: string,
): Promise<Response>
```

Lógica:
1. Busca o log (`*`) com `id = logId` e `status = 'failed'`. Se não existir → 404.
2. Se `message_content` está vazio → re-resolve via `resolveMessageContent` (config + slot).
3. Tenta a `instance_id` original primeiro (se ainda online via `connectionState`); se falhar ou estiver offline, chama `select_best_instances` para o `group_jid` e tenta até 5 candidatas (mesmo loop do `send.ts`, reutilizando `dispatchToEvolution`).
4. Em sucesso: update `status='sent'`, `sent_at=now()`, `retry_count = retry_count + 1`, persiste `instance_id`/`evolution_instance_id`/`message_content`, `error_message` opcional com `tried[]`.
5. Em falha: update `error_message`, `retry_count = retry_count + 1`, `last_error_at = now()`, mantém `status='failed'`.

**Não toca em:** `slot.last_scheduled_index`, `scheduled_for`, dedup, ou qualquer coisa relacionada ao próximo ciclo.

---

## 6. Roteamento no `group-blast-send/index.ts`

**Arquivo:** `supabase/functions/group-blast-send/index.ts`

Adicionar action `retry` (admin-only, mesma validação do `prepare`/`send_now`):

```ts
if (action === "retry") {
  if (!body.log_id) return jsonResponse({ error: "log_id obrigatório" }, 400);
  return await handleRetry(supabase, evo.url, evo.key, body.log_id);
}
```

---

## 7. UI — `GroupBlastLogsCard.tsx`

**Arquivo:** `src/components/admin/whatsapp/GroupBlastLogsCard.tsx` (novo)

Substitui a tabela de logs inline atual da `DisparoGrupoTab.tsx` por um card dedicado.

Colunas:

| Campo | Conteúdo |
|---|---|
| Status | `MessageStatusBadge` colorido (`sent`/`failed`/`pending`) |
| Grupo | nome se disponível em config, fallback JID truncado |
| Instância | `evolution_instance_id` ou `—` |
| Agendado | `scheduled_for` via `fmtDate(..., "short")` |
| Enviado | `sent_at` via `fmtDate` ou `—` |
| Erro | `error_message` em accordion expansível (linha extra), só se houver |
| Tentativas | `retry_count` (badge sutil, só se > 0) |
| Ação | botão **Reenviar** (`RotateCw`) visível apenas em `status='failed'` |

Filtros:
- Status: `all` / `sent` / `failed` / `pending`
- Config: dropdown com configs existentes
- Data (from/to): inputs `date`

Comportamento do botão Reenviar:
```ts
await supabase.functions.invoke("group-blast-send", {
  body: { action: "retry", log_id: log.id },
});
```
Toast de sucesso/erro + `fetchLogs()` para refresh.

Limita render a 100 logs (com paginação simples "carregar mais 100" se necessário).

---

## 8. Integração na `DisparoGrupoTab.tsx`

**Arquivo:** `src/components/admin/whatsapp/DisparoGrupoTab.tsx`

- Remove o bloco atual de tabela de logs (linhas ~540 em diante).
- Renderiza `<GroupBlastLogsCard configs={configs} />` no lugar.
- Mantém todo o resto (cards de config, dialog, etc.) intacto.

Opcional (recomendado): adicionar um pequeno painel acima do card de logs mostrando o último `group_blast_prepare_runs` (data + slots agendados + skipped_dedup), para responder rapidamente "o prepare rodou hoje?".

---

## 9. Tipos TS

Atualizar interface `BlastLog` em `DisparoGrupoTab.tsx` (e/ou novo card) com:
```ts
retry_count: number;
last_error_at: string | null;
evolution_instance_id: string | null;
```

`src/integrations/supabase/types.ts` é regenerado automaticamente após a migração.

---

## O que NÃO muda

- Lógica de rotação de horários e slots (`last_scheduled_index`)
- Dedup de 20h no `prepare`
- Triggers de mapeamento instância ↔ grupo
- Crons existentes (prepare diário e send a cada minuto)
- Estrutura de `group_blast_configs`
- `send-now.ts` e fluxo de "Disparar/Test"

---

## Resumo dos arquivos

| Arquivo | Ação |
|---|---|
| `supabase/migrations/<novo>.sql` | colunas `retry_count`, `last_error_at`, tabela `group_blast_prepare_runs` + RLS |
| `supabase/functions/_shared/group-blast/send.ts` | refatora em funções pequenas + tolerância 10min |
| `supabase/functions/_shared/group-blast/prepare.ts` | grava registro em `group_blast_prepare_runs` por config |
| `supabase/functions/_shared/group-blast/retry.ts` | **novo** — handleRetry isolado |
| `supabase/functions/group-blast-send/index.ts` | nova action `retry` |
| `src/components/admin/whatsapp/GroupBlastLogsCard.tsx` | **novo** — tabela com filtros + reenviar |
| `src/components/admin/whatsapp/DisparoGrupoTab.tsx` | substitui tabela inline pelo novo card |
