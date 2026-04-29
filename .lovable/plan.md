
# Mensagens de templates falhando — Causa raiz e correção

## Diagnóstico (confirmado nos dados reais)

Nas últimas 48h: **4 falhas, 3 sucessos**. As 4 falhas — todas as compras aprovadas — têm o **mesmo erro** retornado pela Evolution API:

```
HTTP 400: {"status":400,"error":"Bad Request",
 "response":{"message":[{"jid":"<numero>@s.whatsapp.net","exists":false,"number":"<numero>"}]}}
```

| Cliente | `recipient_phone` salvo | DDD interpretado errado pela Evolution |
|---|---|---|
| Maria Regina | `55999051993` | `55` virou DDI, sobra `999051993` |
| Francisco Sales | `98984954601` | `98` (MA) virou DDI |
| Denis Cury | `11991447973` | `11` (SP) virou DDI (USA) |
| Alexandre Nalon | `33991540838` | `33` (MG) virou DDI (França) |

### Por que está acontecendo
1. Webhook do Kirvano chega em `handle-kirvano-webhook/index.ts`. A função `normalizePhone()` (linhas 79–87) **remove** o `55` quando o número tem 12/13 dígitos.
2. O número é salvo em `perfis.celular` e na fila `message_queue.recipient_phone` **sem o DDI**, com 10 ou 11 dígitos.
3. `process-queue/index.ts` linha 137 envia para a Evolution **direto**: `number: item.recipient_phone`.
4. A Evolution monta o JID `<DDD+numero>@s.whatsapp.net` — sem `55` — e responde `exists: false` porque interpreta o DDD como código de país.

**Os números existem no WhatsApp; o problema é o formato enviado.** O resto do sistema já espera os dados sem o DDI; não convém mexer no que está armazenado.

## Correção (cirúrgica, 1 arquivo)

Em **`supabase/functions/process-queue/index.ts`** (função que dispara templates da fila), prefixar `55` no momento do POST para a Evolution, sem alterar o valor salvo no banco:

```ts
// Antes do fetch:
const digits = String(item.recipient_phone || "").replace(/\D/g, "");
const numberWithDdi =
  digits.startsWith("55") && (digits.length === 12 || digits.length === 13)
    ? digits
    : `55${digits}`;

// No body:
body: JSON.stringify({ number: numberWithDdi, text: messageText }),
```

Trata os 3 casos:
- `11991447973` (11 dígitos) → vira `5511991447973` ✅
- `98984954601` (11 dígitos) → vira `5598984954601` ✅
- `5511991447973` (já com DDI) → mantém ✅
- `999051993` (9 dígitos, irregular) → vira `55999051993` (Evolution julga validade)

## Reprocessamento dos 4 envios falhos

Após o fix, reenfileirar via UPDATE:

```sql
UPDATE message_queue
SET status = 'pending', error_message = NULL, retry_count = 0
WHERE id IN (
 'fa0ac564-4d4a-4f78-8115-28d11d018b80',
 'a3c38ff5-06c5-41f0-8c54-d69af2e7c3ab',
 '381a40c6-fc3b-4f4a-9f2b-4e954ca7ff2d',
 '4962fb83-341e-4762-adc0-d2e8d64a0bfc'
);
```

Como UPDATE não é permitido pelo acesso atual, isso vira uma **migration** após aprovação.

## Fora do escopo (registrado, não vou tocar agora)
- `process-lead-retargeting`, `cadastro-iniciar-whatsapp`, broadcasts de grupo: usam fluxos próprios, não impactaram esses 4 envios. Se quiser, em uma próxima rodada centralizo o "garante DDI" em `_shared/br-phone.ts` e aplico em todos os pontos.
- `normalizePhone` no webhook do Kirvano: deixar como está. Mexer ali muda dado armazenado em perfis e quebra outras buscas.

## Resumo do que muda ao aprovar
1. Edit em `supabase/functions/process-queue/index.ts` (8 linhas).
2. Migration reabrindo as 4 mensagens falhas como `pending`.
3. O cron pega as 4 no próximo ciclo e dispara — agora com `5511…`, `5598…` etc.
