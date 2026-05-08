
# Plano — Mensagem de Palpites sempre com o resultado mais novo

## Causa raiz (revisão tim‑tim)

Auditei o fluxo completo `group-blast-send` → `schedule.ts` → `resolver.ts` → `palpite-message.ts` → `dispatch.ts`. O bug não está na escolha do "próximo concurso", e sim em **QUANDO a mensagem é montada**:

1. O cron `prepare` roda a cada 30 min (e também quando o admin clica "Preparar"). Ele já chama `resolveMessage()` e grava o **texto pronto** em `group_blast_logs.message_content` com status `pending`.
2. O cron `send` (a cada 1 min) só pega `pending` com `scheduled_for <= now()` e entrega o texto **que já está congelado** no banco — sem nunca reconsultar `resultados_loterias`.
3. Resultado prático: se o `prepare` rodou antes do resultado novo entrar na base (ex.: 19:30 BRT, sorteio 20:00, sync da API ~21:00) e o `send` dispara só às 21:30, a mensagem entregue carrega o **concurso anterior** mesmo com o novo já gravado em `resultados_loterias`. É exatamente o caso do C.3678 que você relatou.
4. O guard anterior em `palpite-message.ts` (`return null` quando `sorteioJaOcorreu && concursoMax < proximoConcurso - 1`) apenas marca o log como `failed` no prepare — não conserta nada quando o resultado chega depois, porque ninguém regera.

Conclusão: precisamos **resolver a mensagem na hora do envio**, não no prepare. O prepare deve só **agendar a intenção** (qual slot, qual grupo, qual horário). O conteúdo é montado pelo dispatcher segundos antes do envio, sempre lendo o último resultado da base.

## Mudanças propostas (sem executar até sua aprovação)

### 1. `schedule.ts` — prepare deixa de resolver
- Remover a chamada a `resolveMessage()` dentro de `scheduleOne`.
- Inserir o log com `status = "pending"`, `message_content = ""` (placeholder) e `message_source = "deferred"`.
- Manter dedup, `last_scheduled_index`, audit em `group_blast_prepare_runs` (campo `slots_resolved` passa a refletir só "agendados").
- `handleSendNow` passa pelo mesmo caminho — agenda em ~5s e o dispatcher resolve.

### 2. `dispatch.ts` — `handleSend` resolve antes de cada entrega
- Para cada log `pending` pronto, **sempre** chamar `resolveMessage()` agora (não só quando `message_content` está vazio — descartar o cache, ele estaria velho).
- Se resolver retornar `null`:
  - Se `scheduled_for` ainda está dentro de uma janela de carência (sugestão: 60 min, configurável), **manter `pending`** e tentar de novo no próximo ciclo do cron (1 min depois). Isso cobre o intervalo "sorteio acabou, API ainda não publicou".
  - Se já passou da carência, marcar `failed` com motivo claro (`source` retornado pelo resolver).
- Se resolver com sucesso: gravar `message_content` + `message_source` no log e seguir para `deliverViaCandidates`.
- `handleRetry` fica igual em espírito, mas também **reresolve** sempre (não reaproveita texto antigo).

### 3. `palpite-message.ts` — remover o guard que retornava null
- O motivo do guard era evitar mandar resultado velho. Com resolução no envio + janela de carência no dispatcher, o guard vira contraproducente (impede a mensagem mesmo depois do sync).
- Manter o uso de `getProximoConcursoReal()` para o cabeçalho ("Concurso N"), mas a seção "Último Resultado" passa a ler o **último concurso real do DB no momento do envio**, então sempre estará alinhada.
- Adicionar log claro: `[palpite-message] cabeçalho=Concurso X | últimoDB=Y` para rastrear.

### 4. `resolver.ts` — sem mudança funcional
- Continua sendo a única fonte de verdade da mensagem; só passa a ser chamado em momento diferente.

### 5. Migração de logs órfãos
- Logs `pending` antigos com texto já congelado: deixá-los como estão (vão ser entregues na próxima execução; se o dispatcher resolver de novo, sobrescreve com a versão fresca — comportamento desejado).
- Não precisa migration de schema; nenhuma coluna nova.

## Como vou validar depois de aprovado

1. Disparar manualmente um `prepare` (admin /admin/whatsapp) — confirmar que logs entram `pending` com `message_content=""` e `message_source="deferred"`.
2. Aguardar o cron `send` (ou chamar via curl) — confirmar nos logs do edge function `[dispatch] resolved at send time` e `message_content` preenchido com `Último Resultado (Concurso <último real>)`.
3. Consultar o DB: o último log enviado deve referenciar o `concurso = max(resultados_loterias.concurso WHERE loteria=...)`.
4. Simular cenário de atraso: derrubar temporariamente o último resultado da base, agendar `send_now`, ver o log ficar `pending` (carência) em vez de `failed` ou de mandar concurso velho; restaurar o resultado e ver o próximo ciclo entregar.

## Arquivos que serão tocados

- `supabase/functions/_shared/group-blast/schedule.ts` (remover resolução)
- `supabase/functions/_shared/group-blast/dispatch.ts` (resolver no envio + carência)
- `supabase/functions/_shared/group-blast/palpite-message.ts` (remover guard, ajustar log)
- Redeploy: `group-blast-send`

Nenhuma alteração de schema, nenhuma migration, nenhuma mudança de UI.

Aguardo sua aprovação para implementar.
