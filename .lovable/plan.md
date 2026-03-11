

## Plano: Substituir delay interno por agendamento em duas fases

### Problema atual
A edge function dorme até 120 minutos dentro da execução, consumindo recursos e arriscando timeout.

### Nova arquitetura

**Fase 1 — Preparação (cron às 09:00 UTC):** `community-daily-message` com `action=prepare`
- Busca o post mais recente
- Gera a mensagem via IA
- Seleciona a instância
- Sorteia um horário aleatório entre 09:00 e 11:00 BRT (12:00–14:00 UTC)
- Salva tudo em `community_group_logs` com status `scheduled` e campo `scheduled_for`

**Fase 2 — Disparo (cron a cada 5 min):** `community-daily-message` com `action=send`
- Busca registro em `community_group_logs` onde `status = 'scheduled'` e `scheduled_for <= now()`
- Envia via Evolution API
- Atualiza status para `sent` e preenche `sent_at`

### Alterações no banco

Migração na tabela `community_group_logs` — adicionar:
- `status` text default `'sent'` (valores: `scheduled`, `sent`, `failed`)
- `scheduled_for` timestamptz nullable
- `message_generated` text nullable (mensagem pré-gerada, renomear uso de `message_sent` para após envio)
- `instance_evolution_id` text nullable (guardar o ID da instância para envio)

### Alterações na Edge Function

Refatorar `community-daily-message` para aceitar `action` no body:

- `action=prepare` (ou default do cron das 09:00):
  1. Verifica dedup (já existe scheduled/sent hoje)
  2. Busca post, gera mensagem IA, seleciona instância
  3. Sorteia `scheduled_for` = hoje 12:00–14:00 UTC (09:00–11:00 BRT)
  4. Insere em `community_group_logs` com status `scheduled`

- `action=send` (chamado pelo cron a cada 5 min):
  1. Busca registro `scheduled` com `scheduled_for <= now()`
  2. Envia via Evolution API
  3. Atualiza para `sent`, preenche `sent_at`
  4. Se falhar, marca `failed`

- `action=test` (skip_delay + skip_dedup): executa tudo imediatamente

### pg_cron

- Manter o job existente das 09:00 UTC, adicionando `{"action":"prepare"}` no body
- Criar novo job `community-daily-send` rodando a cada 5 minutos:
  ```
  */5 * * * * → POST /functions/v1/community-daily-message body={"action":"send"}
  ```

### Resultado
- Função retorna imediatamente (sem sleep)
- Mensagem é disparada no horário sorteado com precisão de ~5 minutos
- Logs mostram o horário planejado vs real

