

## Selecionar instância no ato do envio (sem vínculo prévio)

### Estado atual

Boa notícia: **o agendamento já não vincula instância**. O `prepare` insere `group_blast_logs` com `instance_id = NULL`. A escolha acontece no `handleSend` via `select_best_instance()` no momento do envio.

O que **realmente prejudica** os disparos hoje é o comportamento dentro do `handleSend`:

1. **Sem fallback entre instâncias**: `select_best_instance` retorna **uma única** instância. Se essa instância der erro HTTP no `fetch` (ex.: ficou banida nos últimos segundos, sessão caiu, proxy travou), o log vai direto para `failed` sem tentar outra.
2. **Espera bloqueante absurda**: o loop `attempt 1..3` faz `await sleep(60_000)` entre tentativas. Como a Edge Function tem teto de ~60s, basta uma espera para a invocação morrer e o log ficar `pending` com a próxima invocação repetindo o mesmo problema.
3. **Status `online` defasado**: a coluna `whatsapp_instances.status` é atualizada por jobs separados (sync). A função pode escolher uma instância marcada `online` que na prática está `close`/`banned` agora.
4. **Sem reordenação por saúde recente**: `select_best_instance` ordena só por `last_message_at ASC NULLS FIRST`. Se uma instância acabou de falhar, ela continua sendo a primeira opção da próxima escolha.

O usuário está certo: a instância **deve** ser resolvida no ato do envio, e mais — deve haver **fallback ao vivo** se a escolhida falhar.

### O que muda

**Arquivo único:** `supabase/functions/group-blast-send/index.ts`

#### 1. Substituir `select_best_instance` (single) por `select_best_instances` (lista priorizada)

Nova função SQL `select_best_instances(limit_n int)` retornando até N instâncias elegíveis ordenadas por:
1. `status = 'online'` (mantém)
2. `messages_sent_today < daily_limit`
3. `last_message_at` respeitando cooldown
4. `last_message_at ASC NULLS FIRST` (já existe)

Retorna 5 candidatas em vez de 1. A função antiga `select_best_instance` é mantida para compatibilidade (chamadas em outros lugares).

#### 2. Loop de fallback no envio

No `handleSend`, para cada `log` pendente:

```text
candidatos = select_best_instances(5)   // resolvido no ato
para cada candidato:
   monta mensagem (uma só vez, fora do loop)
   tenta fetch Evolution
   se 2xx → grava sent + instance_id usado + register_instance_usage → break
   se erro HTTP/timeout:
     • registra warning com instance + status + body
     • marca a instância com cooldown imediato (last_message_at = now())
     • passa para o próximo candidato
se nenhum candidato funcionou → grava failed com lista de instâncias tentadas
```

Resultado: se 4 instâncias estiverem ruins e 1 saudável, o envio sai pela saudável **sem** intervenção humana e **sem** depender de retry futuro.

#### 3. Remover o `sleep(60_000)` bloqueante

Substituir o loop "espera 60s e tenta de novo" por:
- Se `select_best_instances` retornar lista vazia → log permanece `pending` (não é erro, é cooldown legítimo) e a próxima execução do cron (1 min depois) tenta de novo. Sem bloqueio.

#### 4. Sanity-check rápido da instância antes do envio (opcional, leve)

Antes do `fetch /message/sendText`, fazer `GET /instance/connectionState/{name}` (call rápida, ~200ms). Se vier diferente de `open`, pula para o próximo candidato e marca a instância como `offline` na tabela. Isso reduz drasticamente envios em instâncias que ficaram fantasma.

Custo: 1 request HTTP extra por envio. Trade-off positivo, especialmente após troca de servidor.

#### 5. Telemetria por tentativa

Cada tentativa registra um `console.log` estruturado: `log_id`, `attempt`, `instance`, `result (sent/http_status/error)`. O `error_message` final salvo no log inclui a sequência de tentativas (`tried: [eros-q7f7→503, galaxy-x91→open ok]`).

#### 6. Garantia de que `prepare` nunca vincula instância

Auditoria do `prepare` (já está correto hoje): asserto explícito no insert para `instance_id: null, evolution_instance_id: null`. Adiciono comentário claro: **"instance_id é resolvida em handleSend; nunca pré-vincular aqui."**

#### 7. Limpar a edge antiga `group-blast` (paralela e divergente)

A função `group-blast/index.ts` ainda existe e tem o mesmo `prepare`/`send` antigo (a 859 linhas). Hoje quem dispara é a `group-blast-send` (cron confirma). Mantenho a antiga **read-only** mas adiciono um header `console.warn("[group-blast] DEPRECATED — use group-blast-send")` no entrypoint para capturar se algo ainda chama, sem remover (evita quebrar dependências escondidas).

### Migration SQL

Uma migration nova (schema): cria `select_best_instances(p_limit int default 5)`.

```sql
CREATE OR REPLACE FUNCTION public.select_best_instances(p_limit int DEFAULT 5)
RETURNS TABLE(instance_id uuid, evolution_instance_id text, phone_number text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN QUERY
  SELECT wi.id, wi.evolution_instance_id, wi.phone_number
  FROM public.whatsapp_instances wi
  WHERE wi.status = 'online'
    AND COALESCE(wi.messages_sent_today, 0) < COALESCE(wi.daily_limit, 100)
    AND (
      wi.last_message_at IS NULL
      OR wi.last_message_at <= now() - (
        (wi.cooldown_queue -> (wi.cooldown_queue_index % jsonb_array_length(wi.cooldown_queue)))::int || ' minutes'
      )::interval
    )
  ORDER BY wi.last_message_at ASC NULLS FIRST
  LIMIT p_limit;
END;
$$;
```

### Garantias

- **Zero vínculo prévio**: a instância é decidida na hora; logs antigos com `instance_id` preenchido só refletem o registro pós-envio (auditoria).
- **Resiliente a queda de instância**: até 5 tentativas com instâncias diferentes por log, na mesma invocação.
- **Sem invocação travada**: removido o `sleep(60_000)` que estourava o tempo da Edge.
- **Compatibilidade**: `select_best_instance` antigo continua existindo (não quebra outras edges que possam usá-lo).
- **Visibilidade total**: `error_message` traz a trilha de instâncias tentadas e os status HTTP.
- **Edge antiga marcada deprecada**: sem remoção, mas com aviso para detectar consumidores ocultos.

