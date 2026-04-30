## Diagnóstico

Os disparos noturnos de **29/04 (23h BRT)** não saíram porque os logs já estavam na fila **antes do refactor do módulo de Disparo em Grupo** feito hoje mais cedo. Antes do refactor, a mensagem (palpite/IA) era resolvida no momento do envio (`dispatch`). Depois do refactor, o `dispatch` passou a exigir que `message_content` já estivesse preenchido pelo `prepare` — e marca como `failed` qualquer log "órfão" sem conteúdo, com a mensagem:

> *"Órfão da transição de refactor — sem conteúdo pré-resolvido. Use Reenviar para regenerar."*

**Logs afetados no dia 29 (noturno):** 8 logs entre 23:18 e 23:34 BRT, distribuídos entre:
- Mega Sena - Post (slot_2)
- Mega Sena - Sala Vip / Sala Secreta
- Lotofácil - Post (slot_2) / Sala Secreta

Total atual de órfãos pendentes/failed na tabela: **12**.

Os disparos diurnos do dia 30 (00h e 12h BRT) saíram normalmente porque foram agendados pelo `prepare` novo (com `message_content` pré-resolvido).

## Por que o "Reagendar agora" não cobriu?

O botão **Reagendar agora** chama `prepare`, que agenda apenas o **próximo horário** de cada slot (`last_scheduled_index + 1`). Como vários horários noturnos já tinham logs antigos na fila, o `prepare` os ignorou via dedup de 20h e seguiu para o próximo horário do dia seguinte. Ou seja, os órfãos ficaram travando o dedup sem nunca serem substituídos.

## Plano de correção

### 1. Limpar órfãos travados (one-shot SQL)

Apagar todos os logs sem `message_source` E sem `message_content` que estejam `pending` ou `failed`, para liberar o dedup. Isso é seguro porque eles nunca serão enviados como estão.

```sql
DELETE FROM group_blast_logs
WHERE message_source IS NULL
  AND (message_content IS NULL OR message_content = '')
  AND status IN ('pending','failed');
```

### 2. Forçar replanejamento dos slots noturnos hoje (30/04)

Disparar `prepare` com `force=true` apenas para cobrir os horários noturnos. Como `force=true` agenda em `now + 30s * (slotIdx+1)` (modo teste imediato), **não usar force agora**. Em vez disso, basta um `prepare` normal — após a limpeza acima, ele encontrará os slots livres e reagendará os próximos horários (incluindo os noturnos de hoje).

```bash
# Via UI: botão "Reagendar agora" na aba WhatsApp → Disparo em Grupo
# OU via curl:
POST /functions/v1/group-blast-send  body: { "action": "prepare" }
```

### 3. Hardening no `prepare` para evitar nova ocorrência

Atualizar `supabase/functions/_shared/group-blast/schedule.ts` na função `scheduleOne`: a checagem de dedup atual é

```ts
.neq("status", "failed")
```

Adicionar também: ignorar logs órfãos (sem `message_source`) ao calcular dedup. Ou seja, trocar para:

```ts
.neq("status", "failed")
.not("message_source", "is", null)
```

Assim, mesmo se houver órfão "pending" travado, o `prepare` cria um novo log válido por cima e o dispatcher entrega o novo (o órfão envelhece e some do dedup em 20h).

### 4. (Opcional) Limpeza automática

Adicionar um job cron diário (`0 5 * * *` BRT = `8 UTC`) que rode a query do passo 1 para garantir que nenhum órfão fique acumulando.

## Resumo de arquivos a tocar

- **Migração SQL** (one-shot): DELETE dos órfãos.
- **`supabase/functions/_shared/group-blast/schedule.ts`**: ajuste na query de dedup em `scheduleOne` (~3 linhas).
- **(Opcional)** Migração SQL adicional: cron diário de limpeza.

Após implantado, clico "Reagendar agora" para repopular a fila de hoje à noite com conteúdo pré-resolvido.
