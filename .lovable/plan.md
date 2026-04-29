
## Diagnóstico

A refatoração está **correta** (o último envio às 00:09 BRT funcionou perfeitamente: `message_source=palpite:megasena`, 1776 chars, entregue OK). Porém existe **um problema operacional crítico** herdado da transição:

### O que aconteceu

- O cron `prepare` rodou às **23:12 BRT (28/04)** e criou **12 logs pending** para todos os horários de hoje.
- Naquele momento o código antigo ainda estava no ar: os logs foram inseridos com `message_content=""` e `message_source=NULL`.
- A função foi redeploy logo depois: a run das **00:08 BRT (29/04)** já gerou conteúdo corretamente.
- O novo `dispatch.ts` filtra `.neq("message_content","")` — então os 12 logs órfãos serão **ignorados para sempre** pelo loop do cron.

### Impacto

Hoje (29/04), entre **08:02 BRT e 23:34 BRT**, os 12 disparos agendados **não vão sair** — não por falha de envio, mas porque o dispatcher os pula silenciosamente.

```text
08:02 BRT → 2 logs vazios (não vão sair)
10:34 BRT → 2 logs vazios (não vão sair)
23:18 BRT → 2 logs vazios
23:22 BRT → 1 log vazio
23:30 BRT → 2 logs vazios
23:31 BRT → 1 log vazio
23:32 BRT → 1 log vazio
23:34 BRT → 1 log vazio
```

## Plano de correção

### 1. Backfill dos logs órfãos (migration única)
Atualizar os 12 logs `pending` com `message_content=''` para `status='failed'`, com `error_message='Órfão da transição de refactor — sem conteúdo pré-resolvido'`. Isso libera a fila e dá visibilidade no admin.

Por que `failed` e não tentar resolver agora: o `slot_id` desses logs aponta para o `slots[]` da config no momento do prepare; resolver agora pode usar config diferente. Marcar como failed permite que o admin clique em "Reenviar" e o `handleRetry` regenera a mensagem usando a config atual (esse caminho já está implementado no `dispatch.ts:286-306`).

### 2. Safety net no dispatcher (`dispatch.ts`)
Adicionar lógica defensiva: se um log `pending` chegou ao dispatcher com `message_content` vazio (não deveria, mas defesa em profundidade), tentar resolver na hora via `resolveMessage` antes de pular. Se falhar a resolução → marcar `failed` com motivo claro. Nunca mais um log fica "preso" silenciosamente.

```typescript
// dispatch.ts handleSend — remover o .neq("message_content","")
// e adicionar resolução last-chance dentro do loop
if (!log.message_content?.trim()) {
  const { data: cfg } = await supabase.from("group_blast_configs")
    .select("slots, palpite_settings").eq("id", log.config_id).maybeSingle();
  const slot = cfg?.slots?.find(s => s.id === log.slot_id);
  const r = await resolveMessage(supabase, slot, cfg, apiKey, baseUrl);
  if (!r.content) {
    await markFailed(supabase, log.id, `Sem conteúdo pré-resolvido + resolução last-chance falhou (${r.source})`);
    failed++;
    continue;
  }
  log.message_content = r.content;
  await supabase.from("group_blast_logs")
    .update({ message_content: r.content, message_source: r.source })
    .eq("id", log.id);
}
```

### 3. Backfill manual imediato (opcional, recomendado)
Disparar `action=prepare` com `force=true` agora para gerar logs novos garantidos com conteúdo, para os horários do resto de hoje. As próximas runs do cron já vão funcionar normalmente.

## Validação pós-correção

- `SELECT status, count(*) FROM group_blast_logs WHERE created_at > now() - interval '24h' GROUP BY status` — esperar 0 pending sem conteúdo.
- Logs do edge `group-blast-send` no próximo horário agendado devem mostrar `[dispatch] send done: sent=N`.
- Conferir no admin que aparece audit `slots_resolved > 0` na tabela `group_blast_prepare_runs`.

## Fora de escopo

- O código refatorado (resolver/schedule/dispatch) não precisa de mudanças estruturais. A arquitetura de pré-resolução está funcionando como projetada — a falha foi só a janela de transição.
