
## Problem

After a lottery draw happens (~20:00 BRT), the API takes several hours to publish results. During this gap, all messages and studies still reference the just-drawn contest as "próximo" because:

1. `resultados_loterias` hasn't received the new result yet, so `ultimoConcurso + 1` points to the contest that ALREADY happened.
2. `proximos_concursos.data_sorteio` is in the past but nobody checks that.
3. The footer "Próximo Concurso" shows a stale date/contest.

**Example**: Draw for Lotofacil 3677 happened on May 5 at 20:00 BRT. Studies and messages generated after that still say "Concurso 3677" and "Próximo Concurso: 3677 - 05/05". They should say "Concurso 3678".

## Solution

Create a shared helper that determines the real "próximo concurso" by checking if the `proximos_concursos.data_sorteio` has already passed in BRT. Use this helper in all message/study generation paths.

### 1. Create shared helper: `supabase/functions/_shared/proximo-concurso-helper.ts`

A function `getProximoConcursoReal(supabase, loteria)` that:
- Reads `proximos_concursos` for the lottery
- Reads the latest `resultados_loterias` concurso
- Checks if `proximos_concursos.data_sorteio` is today or past (BRT, after 21:00 BRT to account for draw time + margin)
- If the draw date has passed: returns `{ numero: proximos.numero_concurso + 1, dataSorteio: null, drawAlreadyHappened: true }`
- If not: returns the normal `proximos_concursos` data with `drawAlreadyHappened: false`
- Also returns the correct `ultimoConcurso` number (from the DB or from proximos if the draw happened)

### 2. Update `palpite-message.ts`

After fetching the latest result, call the helper to determine the real next contest number. If `drawAlreadyHappened`, use `concursoMax + 2` instead of `concursoMax + 1` for the message header "Palpites X - Concurso N".

### 3. Update `generate-guide-post/index.ts`

Before computing `proxConcurso = ultimoConcurso + 1`, check via the helper if that contest's draw already happened. If so, skip generation (the study would be stale) OR adjust to the real next contest. The lock/dedup mechanism should also account for this.

### 4. Update `glossario.ts` / `montarRodapeProximoConcurso`

The footer function already receives data from `proximos_concursos`. The caller (generate-guide-post) should pass the corrected data from the helper. If the draw already happened and we don't know the next date, omit the footer or show just the contest number without a date.

### 5. Update `resolver.ts` (group blast)

The AI message resolver fetches the latest community post. If the post references a contest that already happened, the message will be stale. The resolver should check the helper before resolving AI messages.

## Technical Details

The BRT cutoff logic:
```
- Get current time in BRT
- If proximos_concursos.data_sorteio < today_BRT: draw happened (past day)
- If proximos_concursos.data_sorteio == today_BRT AND current_hour_BRT >= 21: draw likely happened (same day, after draw time + buffer)
- Otherwise: draw hasn't happened yet
```

Files to create/modify:
- `supabase/functions/_shared/proximo-concurso-helper.ts` (new)
- `supabase/functions/_shared/group-blast/palpite-message.ts`
- `supabase/functions/generate-guide-post/index.ts`
- `supabase/functions/_shared/guide-post/glossario.ts`
- `supabase/functions/_shared/group-blast/resolver.ts`

All affected edge functions will be redeployed and tested.
