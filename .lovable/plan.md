## Diagnóstico do "não houve disparo nos grupos hoje"

### O que os dados mostram

- **Hora atual do banco:** 29/04 02:07 UTC = **28/04 23:07 BRT**
- **Cron `group-blast-prepare`** (jobid 61) está agendado para `0 7 * * *` (07:00 UTC = **04:00 BRT diariamente**)
- **Última execução do prepare:** 28/04 07:00 UTC (28/04 04:00 BRT) — sucesso
- **Próxima execução:** 29/04 07:00 UTC (29/04 04:00 BRT) — ainda não aconteceu
- **Logs criados após 28/04 07:00 UTC:** `0` registros

Ou seja, do ponto de vista do sistema, o "dia" cobertura é **28/04**, e o prepare de **29/04** só roda em ~5 horas. Tecnicamente o cron está funcionando — mas há sintomas que precisam ser corrigidos.

### Problema #1 — Prepare só roda 1x por dia, sem reprocessar slots futuros

O cron roda às 04:00 BRT e agenda **apenas a próxima ocorrência** de cada slot (com base em `last_scheduled_index`). Se um disparo falha, é cancelado, ou um novo grupo/slot é adicionado depois das 04:00, **nada novo é agendado até o próximo dia**.

No caso de hoje: o prepare das 04:00 BRT do dia 28 agendou os horários do dia 28. Como nenhum prepare rodou ainda no dia 29, **não existe nada agendado para hoje** — e quando o relógio passar das 00:00 BRT do dia 29, qualquer slot com horário entre 00:00 e 04:00 (não há, mas poderia haver) também ficaria sem agendar.

### Problema #2 — Slots de Mega Sena foram resetados (`last_scheduled_index = -1`)

Todas as 3 configs de Mega Sena (`Post`, `Sala Vip`, `Sala Secreta`) estão com `last_scheduled_index: -1`. Isso indica que foram editadas/recriadas e o prepare de hoje (28/04 04:00) **deveria ter agendado** o índice 0 — mas como você fez mudanças nas configs depois das 04:00 BRT (updated_at = 28/04 02:56 a 03:52 UTC = **23:56 BRT do dia 27 a 00:52 BRT do dia 28**, ou seja, **antes do prepare**), os horários *foram* agendados às 04:00 BRT, mas todos os logs criados nesse momento têm `scheduled_for` em **28/04 03:12** (madrugada) — muito antes da hora real do slot (08:02–23:58 BRT).

Olhando o código de `brTimeToScheduledUtc`: ele calcula `parseInt(hh) + 3` (hora UTC = hora BRT + 3) e, se o resultado já passou, soma 24 h. Mas existe uma **falha sutil**: ele constrói o Date com `now.getUTCDate()` (data UTC). Quando o cron roda às 07:00 UTC (= 04:00 BRT), ainda é o **mesmo dia UTC**. Mas o usuário entende "08:02 BRT de hoje" como um horário do dia em curso. Os 5 logs `failed` confirmam: `scheduled_for = 2026-04-28 03:12:xx UTC` (criados pelo botão "Reagendar agora" com `force=true`, `+30s × idx`), e falharam por **"Mensagem vazia (slot.message_type=ai, source=ai:megasena, value=null)"**.

### Problema #3 — Conteúdo de IA está retornando `null`

5 dos disparos de hoje **falharam** com `Mensagem vazia (slot.message_type=ai, source=ai:megasena/lotofacil, value=null)`. O resolver de mensagem `ai:<loteria>` está devolvendo `null` no momento do envio — provavelmente porque o post do dia ainda não foi gerado pelo `precompute-daily-posts` ou porque o lookup está procurando pela chave errada.

### Problema #4 — Audit `group_blast_prepare_runs` quebrado

O código em `prepare.ts` insere `created_at` mas a tabela só tem `ran_at`. Isso provavelmente está gerando um warning silencioso e impedindo a auditoria de funcionar (a tabela está vazia). Não bloqueia disparos, mas dificulta debugar.

---

## Plano de correção

### 1. Reagendar agora os disparos de 29/04 (manual)
Acionar `group-blast-send` com `action: "prepare"` (sem force) — isso vai criar logs para os horários de hoje 29/04 que ainda não passaram, respeitando o dedup de 20 h.

### 2. Mudar o cron `prepare` para rodar mais vezes ao dia
Alterar o schedule do jobid 61 de `0 7 * * *` (1x/dia) para `*/30 * * * *` (a cada 30 minutos). Como `prepare` já tem dedup de 20 h por (config, slot, group), múltiplas execuções não criam duplicatas — só "preenchem buracos" se um slot novo for adicionado, ou se o prepare das 04:00 falhar.

### 3. Corrigir o resolver de mensagens IA
Investigar `_shared/group-blast/send.ts` (resolução `source=ai:<loteria>`) e o status de `precompute-daily-posts`. Garantir que:
- Se não houver post de IA pronto, o log fique como `pending` (com retry curto) em vez de `failed`.
- O `precompute-daily-posts` rode antes das 06:00 BRT (antes do primeiro horário de slot 08:02).

### 4. Corrigir audit de prepare
Trocar `created_at` por `ran_at` no insert de `group_blast_prepare_runs` em `supabase/functions/_shared/group-blast/prepare.ts`.

### 5. Melhorar painel admin de WhatsApp
Em `GroupBlastScheduleCard`:
- Mostrar quantos logs `pending` existem para hoje (visualmente, "X disparos agendados para hoje").
- Botão "Reagendar agora" já existe — ok.
- Adicionar contagem de `failed` nas últimas 24 h com link para investigar.

---

## Resumo executivo (para o usuário)

> Hoje (29/04) ainda não houve disparos porque:
> 1. O agendamento automático roda só **1x/dia, às 04:00 da manhã**, e o de hoje ainda não rodou (faltam ~5 h).
> 2. Os disparos do dia 28 que rodaram à noite **falharam** porque a mensagem de IA voltou vazia.
>
> Vou: rodar o "Reagendar agora" para criar os disparos de hoje, mudar o cron para rodar a cada 30 min (mais resiliente), corrigir o gerador de mensagem IA e melhorar o painel admin para você enxergar isso na hora.

Aprova para eu implementar?
