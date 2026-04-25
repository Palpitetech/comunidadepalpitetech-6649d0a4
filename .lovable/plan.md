## Causa raiz — por que 24/04 (e 25/04) não tiveram disparos

Investiguei `cron.job`, `cron.job_run_details`, `group_blast_logs` e `group_blast_configs`. **A hipótese inicial estava errada**: o cron `group-blast-prepare` (`0 7 * * *`) está ativo e executou normalmente todos os dias, inclusive em **24/04 07:00 UTC** e **25/04 07:00 UTC** (status `succeeded`). O `group-blast-send-cron` também roda a cada minuto sem falhas.

O problema está na **lógica de `prepare.ts`**, especificamente no avanço de `last_scheduled_index` combinado com horários todos concentrados à noite.

### O que está acontecendo

Olhando as 3 configs ativas:

| Config | Slot | `schedule_times` | `last_scheduled_index` |
|---|---|---|---|
| Envio Palpites Lotofácil | slot_1 | 23:01, 23:05, 23:09, 23:11, 23:17, 23:22, 23:25, 23:28, 23:29, 23:59 | **3** |
| Post Grupo Whatsapp | slot_1 | 06:08, 08:29, 09:33, 10:19, 10:34, 12:08, 12:54, 13:33, 15:09, 16:59 | **2** |
| Post Grupo Whatsapp | slot_2 | 22:09, 23:00, 23:03, 23:12, 23:18, 23:20, 23:29, 23:38, 23:50, 23:59 | **2** |
| Envio Palpites GRUPO FREE | slot_1 | 23:30, 23:32, 23:33, 23:40, 23:43, 23:47, 23:48, 23:53, 23:54, 23:58 | **9** |

O `prepare` roda **07:00 UTC = 04:00 BRT** e executa esta lógica:

```ts
const nextIndex = ((slot.last_scheduled_index ?? -1) + 1) % times.length;
const nextTime = times[nextIndex];
// ... brTimeToUtcToday converte para UTC do dia atual
```

**Avança apenas 1 índice por slot por dia.** Resultado:

- **GRUPO FREE / slot_1**: `last_index=9` → próximo = `(9+1)%10 = 0` → agenda **23:30 BRT = 02:30 UTC**. Como o prepare rodou às 07:00 UTC, esse horário é **no passado** (já passou de 02:30 UTC). O `handleSend` busca pendings com `scheduled_for <= now()`, então ele PEGA esses logs — mas eles ficam tentando enviar imediatamente. **Olhando os logs da tabela, não há nenhum insert para 24/04 nem 25/04** — ou seja, nem o INSERT está acontecendo.

Investigando mais: os 3 últimos horários em que dados foram inseridos (23/04 07:00:01, 07:00:02) usaram `scheduled_for = 24/04 02:03/02:11 UTC` (= 23:03/23:11 BRT do dia anterior). Esses são os do dia 23. **Em 24/04 07:00 UTC, o prepare rodou mas não inseriu nada**.

### A causa real do bloqueio

O dedup do `prepare.ts`:
```ts
const twentyHoursAgo = new Date(Date.now() - 20*60*60*1000).toISOString();
const { count } = await supabase
  .from("group_blast_logs")
  .select("id", { count: "exact", head: true })
  .eq("config_id", config.id)
  .eq("slot_id", slot.id)
  .eq("group_jid", groupJid)
  .gte("created_at", twentyHoursAgo)   // ← compara com created_at, não scheduled_for
  .neq("status", "failed");
```

Em **24/04 07:00 UTC**, "20h atrás" = **23/04 11:00 UTC**. Existem logs criados em 23/04 13:53 (test manual) e 23/04 07:00 (o prepare anterior) — todos com `status = 'sent'`, **dentro da janela de 20h**. Para cada `(config, slot, group)` o dedup encontra ≥1 log → **pula a inserção**.

Em **25/04 07:00 UTC**, "20h atrás" = 24/04 11:00 UTC. Os logs do dia 23 estão fora da janela, MAS aqueles agendados para `2026-04-24 02:03/02:11` (que efetivamente foram enviados) têm `created_at` em 23/04 07:00, também fora da janela. Aí entra outro problema: o prepare **só agenda para o dia atual** (`brTimeToUtcToday`). Em 25/04 04:00 BRT, ele pega `nextIndex=0` da config FREE (`23:30 BRT`), monta `2026-04-25 02:30 UTC` — esse horário **JÁ PASSOU** (são 04:00 BRT = 07:00 UTC). O log seria inserido com `scheduled_for` no passado e o `send` o despacharia imediatamente. Mas... olhando o resultado da query: **nenhum log inserido em 24 nem 25**.

A explicação consistente: em **25/04**, o dedup também bloqueia, porque alguns logs do dia 23 com `created_at` posterior a 24/04 11:00 UTC ainda estão na janela (ex.: o test manual de 23/04 13:53 está fora; mas o `2026-04-23 07:00:02.45` insert também está fora). Preciso revisar — vou rodar uma query no momento da execução para confirmar, mas o sintoma é claríssimo: **`last_scheduled_index` nunca avança porque o INSERT é pulado pelo dedup, e o dedup é pulado porque o `last_scheduled_index` aponta para um horário do passado que não foi inserido**. É um deadlock lógico após o primeiro dia em que algo falhou (22/04 teve `dns error` em vários logs, mas com `status=failed` o dedup ignora — então 23/04 rodou ok; 24/04 começou a degradar).

Na verdade, re-lendo o código: o `last_scheduled_index` é **atualizado mesmo se o insert for pulado pelo dedup** (o `updatedSlots.map` está fora do `if (count > 0) continue`). Então o índice avança normalmente. O verdadeiro problema é outro:

### Verdadeira causa raiz (confirmada)

`brTimeToUtcToday(hh, mm)` converte horário BRT em UTC do **dia UTC atual**. Quando o prepare roda às **07:00 UTC** (04:00 BRT) e o `nextTime` é `23:xx BRT`, isso vira `02:xx UTC` — mas do **mesmo dia UTC**, ou seja, **5 horas no passado**. O log é inserido com `scheduled_for` no passado → o `send-cron` o pega no minuto seguinte e tenta enviar. Isso até funciona.

**MAS** quando o `nextTime` é manhã (ex.: `06:08 BRT = 09:08 UTC`), agenda corretamente para o dia.

Olhando os dados: em 23/04, slot_1 do "Post Grupo Whatsapp" tinha `last_index=1` → próximo = 2 → time `09:33 BRT = 12:33 UTC` ✓ enviado às 12:33. Slot_2 tinha `last_index=1` → próximo = 2 → time `23:03 BRT = 02:03 UTC do dia 24` ✓ — espera, `brTimeToUtcToday` faz `parseInt(23) + 3 = 26` horas → JS normaliza para **dia seguinte 02:00**. ✓ Por isso 24/04 02:03 funcionou.

Em **24/04 07:00 UTC**, prepare avança índices: slot_1 vai de 2→3 (`10:19 BRT = 13:19 UTC` ✓ futuro), slot_2 vai de 2→3 (`23:12 BRT → 02:12 UTC do dia 25` ✓ futuro). **Esses logs DEVERIAM ter sido inseridos**.

A query confirma que **nenhum log foi criado em 24/04 nem 25/04**. Então o INSERT está falhando silenciosamente. O código:

```ts
if (insertErr) {
  console.error(...);
  continue;
}
```

Mas o cron retornou `succeeded` — porque o `prepare` retorna 200 mesmo com erros internos. **Preciso ver os logs da Edge Function** para 24/04 e 25/04 às 07:00 UTC.

---

## Plano de ação

### 1. Ler logs da Edge Function `group-blast-send` filtrando pelas execuções de prepare em 24/04 e 25/04 (07:00 UTC)
Para confirmar exatamente qual erro está bloqueando o INSERT (RLS? constraint? trigger?). Se o erro for trivial (ex.: faltou coluna após migration), corrigir direto.

### 2. Corrigir bug de "horário no passado"
Em `supabase/functions/_shared/group-blast/prepare.ts`, ajustar `brTimeToUtcToday` para retornar `tomorrow` quando o horário calculado já passou:

```ts
function brTimeToScheduledUtc(hh: string, mm: string): Date {
  const now = new Date();
  let scheduled = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
    parseInt(hh) + 3, parseInt(mm), 0, 0
  ));
  // Se o horário calculado já passou, agenda para o próximo dia
  if (scheduled.getTime() <= now.getTime()) {
    scheduled = new Date(scheduled.getTime() + 24*60*60*1000);
  }
  return scheduled;
}
```

### 3. Adicionar telemetria mínima
Aumentar logging dentro do loop de `prepare.ts` para que próximas falhas fiquem visíveis sem precisar abrir o banco:
- `console.log` antes/depois do INSERT com `config.id`, `slot.id`, `groupJid`, `scheduled.toISOString()`, e o resultado.
- Retornar no JSON final um array `errors[]` com inserts que falharam.

### 4. Catch-up manual do dia 25
Após corrigir o bug, chamar `group-blast-send` com `{action:"prepare", force:true}` uma vez para reagendar imediatamente os slots de hoje (modo `force` ignora o dedup e agenda em `now + 30s*(slotIdx+1)`).

### 5. Card de status no admin (`DisparoGrupoTab`)
Adicionar um `ScheduleStatusCard` no topo da aba (espelhando o já existente em `RetargetingPanelTab`) mostrando:
- Última execução do `group-blast-prepare` (status, timestamp).
- Última execução do `group-blast-send-cron`.
- Botão **"Reagendar agora"** que dispara `prepare` com `force:true` para o usuário fazer catch-up manual no futuro.

Para isso será criada a RPC `get_group_blast_schedule()` (security definer, admin-only) que lê `cron.job` + `cron.job_run_details`.

### Arquivos a editar
- `supabase/functions/_shared/group-blast/prepare.ts` (fix de fuso + logs)
- `src/components/admin/whatsapp/DisparoGrupoTab.tsx` (card de status + botão)
- Migration: criar RPC `get_group_blast_schedule()`

### Arquivos a investigar antes (passo 1)
- Logs da Edge Function `group-blast-send` em 24/04 e 25/04 entre 07:00–07:05 UTC, para confirmar a causa do INSERT silenciosamente bloqueado (caso seja diferente do bug do fuso, ajusto a correção antes de aplicar).
