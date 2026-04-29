---
name: Group Blast Module Architecture
description: Refactored backend for WhatsApp group broadcasts — message pre-resolved at prepare time
type: feature
---

## Disparo em Grupo — Arquitetura backend (refatorado 2026-04-29)

Mensagens (palpite/IA/manual) são **resolvidas no `prepare`** e gravadas direto em `group_blast_logs.message_content`. O `dispatch` só pega logs já com mensagem válida — nada de IA falhando in-flight.

### Arquivos
```
supabase/functions/group-blast-send/index.ts  ← router
_shared/group-blast/
  ├── schedule.ts   → handlePrepare + handleSendNow (cria logs com mensagem pronta)
  ├── dispatch.ts   → handleSend + handleRetry (entrega via Evolution)
  ├── resolver.ts   → resolveMessage(slot, config) — única fonte de mensagem
  ├── ai-message.ts | palpite-message.ts | lottery-config.ts | types.ts
```

### Actions HTTP
- `send` — cron `* * * * *`, sem JWT
- `prepare` — admin, cron `*/30 * * * *`, suporta `force=true`
- `send_now` — admin, agenda em ~5s
- `retry` — admin, reenvia 1 log failed

### Regras
- Resolver lê **apenas** `palpite_settings` (campos legacy `include_palpites`/`vip_group_link` permanecem na tabela mas são ignorados no backend).
- Slot `palpite` que falhar → fallback automático para IA do mesmo loteria (registrado como `palpite:<loteria>:fallback_ai`).
- Resolução falha → log já entra como `failed` no prepare (não enche fila pending).
- Dedup 20h continua (skip de inserts duplicados em pending/sent).
- Coluna `message_source` em logs: `manual` | `palpite:<lot>` | `ai:<lot>` | `palpite:<lot>:fallback_ai` | `*:no_post` | `*:failed`.
- Audit `group_blast_prepare_runs` ganhou `slots_resolved` e `slots_failed_resolution`.
