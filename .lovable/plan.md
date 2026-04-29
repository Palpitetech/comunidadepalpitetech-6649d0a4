## Objetivo

Substituir a tag com typo `pre_checkou_lp_2grupoviplf` pela correta `pre_checkout_lp_2grupoviplf` apenas nos leads de pré-checkout capturados **hoje** (29/04/2026), para que o cron `process-lead-retargeting` consiga enxergá-los e disparar o template "Lead pré-checkout - Sala Secreta Lotofácil".

## Escopo

- **13 leads** afetados, todos do webhook `Pré Checkout - Lotofácil` (id `ba664329`), criados em 2026-04-29 antes da correção do `source_tag` (que foi feita às 20:13 UTC).
- O webhook em si **já está correto** — novos leads daqui pra frente vão chegar com a tag certa, sem precisar de mais nada.

## Migration a aplicar

```sql
UPDATE public.leads_inbox
SET
  tags = (
    SELECT array_agg(DISTINCT CASE
      WHEN t = 'pre_checkou_lp_2grupoviplf' THEN 'pre_checkout_lp_2grupoviplf'
      ELSE t
    END)
    FROM unnest(tags) AS t
  ),
  updated_at = now()
WHERE 'pre_checkou_lp_2grupoviplf' = ANY(tags)
  AND created_at >= CURRENT_DATE;
```

### O que isso faz

- Filtra apenas leads que contêm a tag torta E foram criados hoje (`created_at >= CURRENT_DATE`).
- Reescreve o array `tags`, trocando a entrada errada pela certa e removendo possíveis duplicatas via `DISTINCT`.
- Atualiza `updated_at` para registrar a correção.
- **Não** mexe em nenhum outro lead, perfil, fila ou template.

## Resultado esperado

- Os 13 leads de hoje ficam com a tag `pre_checkout_lp_2grupoviplf` e passam a satisfazer o `.overlaps("tags", template.include_tags)` do cron de retargeting.
- No próximo run do `process-lead-retargeting` (ou em disparo manual), eles entram na fila do template já reescrito com as 10 novas mensagens.

Posso aplicar?