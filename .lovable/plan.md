

## Diagnóstico: por que os disparos de grupo falharam hoje

Após inspeção dos logs, configs, instâncias e teste real de envio, encontrei **3 causas combinadas** — não foi a Evolution V2 em si.

### O que está saudável

- Evolution V2 (`https://evoapi.palpitetech.com.br`) responde 200, versão 2.3.7, auth OK.
- Todas as 5 instâncias (`Tablet`, `Galaxy`, `Iphone`, `Galaxy Vermelho`, `Eros`) estão `open` no servidor e `online` na tabela `whatsapp_instances`.
- Envio manual de teste para o grupo `120363404046453967@g.us` via instância `Tablet` foi aceito pelo servidor agora há pouco (status `PENDING` retornado normalmente).
- `select_best_instance` está retornando instância válida.

### Causa 1 — Logs órfãos do servidor antigo (22/04)

5 logs de `group_blast_logs` criados às 04:00 BRT de 22/04 ainda apontavam para a instância antiga `Final - 7300 - Palpite Tech` (com espaços e acento). Quando o cron tentou enviar, o DNS antigo `evolution.palpitetech.com.br` já havia caído → erro `dns error: failed to lookup`. Esses já estão marcados como `failed`.

### Causa 2 — Bad Request silencioso após virada (23/04)

Os 2 logs de hoje (config "Envio de Palpites - GRUPO FREE" às 03:25 e 02:53 BRT) falharam com `Bad Request` puro, sem corpo. Esse é o sintoma clássico do Evolution V2 quando o `body.text` chega vazio. O fluxo em `handleSend`:

1. Slot é tipo `palpite` ou `ai` → tenta gerar via IA (Lovable AI Gateway / `generatePalpiteMessage`).
2. Se a IA retorna `null` (timeout, JSON inválido, sem post recente), `messageContent` fica `null`.
3. Há um `if (!messageContent) continue;` para o caso "ai", mas o caso `palpite` cai direto no `fetch` com texto vazio → Evolution rejeita com `Bad Request`.
4. O catch grava `Bad Request` como `error_message` sem o detalhe real.

### Causa 3 — Falta de visibilidade

O `error_message` salvo é só `"Bad Request"`. Não inclui status HTTP, corpo da resposta da Evolution, nem o conteúdo enviado, o que mascarou o problema por horas.

---

## Plano de correção

**Arquivo único:** `supabase/functions/group-blast-send/index.ts`

### 1. Guarda dura contra mensagem vazia (resolve causa 2)

Antes do `fetch` para Evolution, validar:

```ts
if (!messageContent || messageContent.trim().length === 0) {
  await supabase.from("group_blast_logs").update({
    status: "failed",
    error_message: `Mensagem vazia (slot.message_type=${slot?.message_type}, generated=${messageContent === null ? "null" : "empty"})`,
  }).eq("id", log.id);
  failed++;
  continue;
}
```

Aplica para os 3 caminhos (`manual`, `palpite`, `ai`).

### 2. Erro detalhado da Evolution (resolve causa 3)

Trocar o catch genérico por:

```ts
if (!res.ok) {
  const bodyText = await res.text().catch(() => "");
  throw new Error(`HTTP ${res.status} | instance=${instance.evolution_instance_id} | body=${bodyText.slice(0, 300)}`);
}
```

### 3. Retry automático de mensagem vazia gerada por IA

Se `slot.message_type === "palpite"` e a geração falhar, tentar **uma vez** o fallback de "último post" (mesmo caminho do tipo `ai`) antes de marcar como failed. Isso evita perder o slot de envio quando a IA tem hiccup.

### 4. Reabilitar os 7 logs presos (saneamento)

Migration de dados (insert via psql, não migration-tool — é dado, não schema):

```sql
-- Apenas os logs de hoje que falharam por Bad Request — os de ontem ficam como histórico
UPDATE group_blast_logs
SET status = 'pending', error_message = NULL, scheduled_for = NOW()
WHERE status = 'failed'
  AND error_message = 'Bad Request'
  AND created_at >= '2026-04-23 00:00:00+00';
```

Depois disparar `group-blast-send` manualmente para reprocessar.

### 5. Log de boot por execução

Adicionar um `console.log` no início de `handleSend` listando: nº de pendentes, slots envolvidos, instância escolhida — para que `edge_function_logs` mostre claramente cada execução.

---

## Garantias

- **Sem novos pedidos para você**: nenhuma mudança em secrets, nenhum redeploy de Evolution, nenhuma reconexão de instância — o servidor V2 está 100%.
- **Não perde mensagens válidas**: o saneamento só ressuscita os 2 logs de hoje, não os 5 de ontem (que apontavam para instância inexistente).
- **Visibilidade**: a partir do próximo erro, `error_message` mostra o status HTTP + corpo Evolution + nome da instância usada.
- **Defesa em profundidade**: validação dupla (texto vazio + erro detalhado + retry de fallback) garante que o próximo slot real funcione.

