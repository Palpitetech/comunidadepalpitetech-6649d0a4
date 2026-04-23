

## Cron de pré-geração 21:30 / 22:30 / 23:00 BRT (com cancelamento se já gerado)

### Resposta à sua pergunta

**Sim** — `sync-lotofacil` / `sync-megasena` / `sync-quina` / `sync-duplasena` são as funções que consultam a APILoteria buscando novos concursos. Hoje, **só quando o sync encontra um resultado novo** é que ele dispara `precompute-daily-posts` em fire-and-forget.

**Problema:** se a API estiver lenta às 21:30, ou se o sorteio acumular sem entrada nova na API, o precompute do dia seguinte **não roda**. Resultado: amanhã o cron horário cai no fallback síncrono (gera com IA na hora) e voltamos ao modelo antigo.

**Sua proposta resolve isso:** disparar o precompute em 3 janelas (21:30, 22:30, 23:00 BRT) e cancelar as tentativas seguintes se já tiver sucesso.

---

### Arquitetura proposta

```text
21:30 BRT ─► sync-todos (Lotofácil + Mega + Quina + Dupla)
            │
            ├─► se sync encontrou novo resultado
            │   └─► precompute-daily-posts (fire-and-forget, igual hoje)
            │       └─► grava rascunhos do dia seguinte com fatos_snapshot
            │
            └─► precompute-daily-posts SEMPRE roda no fim
                (idempotente: se já tem rascunho do dia → pula)

22:30 BRT ─► mesma sequência
            └─► se 21:30 já gerou tudo → todos os tipos viram "skipped"
                                          (custo zero, sem IA)

23:00 BRT ─► mesma sequência (última rede de segurança)
```

A **idempotência já existente** em `precompute-daily-posts` é o "cancelamento natural": ela verifica se há rascunho/publicado do par `(loteria, tipo)` no dia BRT e pula. Não precisamos adicionar lógica de cancelamento — o segundo e terceiro disparos vão simplesmente reportar "skipped" sem custo de IA.

### Mudanças

**1. Migration nova: 3 cron jobs (`pg_cron` + `pg_net`)**

Cron 1 — `sync-todas-loterias-2130`
- Schedule: `30 0 * * *` (00:30 UTC = 21:30 BRT)
- Ação: `net.http_post` para `sync-lotofacil`, `sync-megasena`, `sync-quina`, `sync-duplasena` em sequência (1 SQL com 4 chamadas)
- Cada sync, quando acha resultado, já dispara `precompute-daily-posts` sozinho
- Em seguida, dispara `precompute-daily-posts` direto (sem filtro `loteria`) como **garantia** caso nenhum sync tenha novidade

Cron 2 — `sync-todas-loterias-2230`
- Schedule: `30 1 * * *` (01:30 UTC = 22:30 BRT)
- Mesma sequência. Se 21:30 já gerou, todos os tipos retornam "skipped".

Cron 3 — `sync-todas-loterias-2300`
- Schedule: `0 2 * * *` (02:00 UTC = 23:00 BRT)
- Mesma sequência. Última rede de segurança.

Todos os 3 jobs chamam **as mesmas 4 funções de sync + precompute geral**, garantindo que:
- Se o resultado oficial cair às 21:00 → 21:30 já pega.
- Se a API atrasar → 22:30 ou 23:00 cobre.
- Se o sorteio acumular sem dado novo → o precompute geral roda assim mesmo, usando o último resultado disponível como base do estudo.

**2. Nada no código das edge functions muda**

- `sync-*` já dispara `precompute-daily-posts` quando acha resultado novo.
- `precompute-daily-posts` já é idempotente — chamadas extras viram "skipped".
- Zero mudança em TypeScript.

**3. Substituir cron antigo (se houver)**

Se já existirem crons separados para cada loteria às 21:30 etc., o migration faz `cron.unschedule(...)` antes de criar os 3 novos consolidados.

### Por que 21:30 / 22:30 / 23:00 (e não 23:30 como na memória antiga)

- Sorteios oficiais: Lotofácil ~20h, Mega/Quina/Dupla ~20h, alguns ~21h.
- 21:30 = primeira janela viável após todos os sorteios do dia.
- 22:30 = retry se API demorou.
- 23:00 = última chance antes de virar o dia BRT (00:00 = `precompute` valida janela do dia).

Você pediu 23:00 (não 23:30). Atendido.

### Comportamento esperado (exemplo de terça com Mega-Sena)

| Horário | O que acontece |
|---|---|
| 21:30 | Sync Lotofácil acha concurso 3669 → grava → dispara precompute. Sync Mega acha concurso 3000 → grava → dispara precompute. Cron também chama precompute geral (todos os tipos já marcados como "skipped"). |
| 22:30 | Todos os syncs retornam "Já está atualizado". Precompute geral retorna 16 "skipped". Custo: ~4 GETs na API + 4 SELECTs no banco. |
| 23:00 | Idem 22:30. |

### Comportamento se a API falhar até 23:00

- Sync devolve erro nas 3 tentativas.
- `precompute-daily-posts` roda assim mesmo (chamado direto pelos crons), usando o último resultado disponível no banco como base.
- Rascunhos do dia seguinte ficam prontos com dados ligeiramente defasados (1 concurso atrás), mas o usuário não vê tela vazia.
- Manhã seguinte, o sync horário pega o resultado faltante; rascunhos antigos seguem válidos (estatística não muda significativamente em 1 concurso).

### Riscos

| Risco | Mitigação |
|---|---|
| 3 crons disparando syncs em paralelo nos 3 horários | OK — são intervalados em 1h, sem sobreposição. |
| Custo IA de gerar 16 posts × 3 tentativas | Idempotência impede. Só a 1ª roda IA; 2ª e 3ª são SELECTs. |
| Sorteio especial cair tarde (Mega da Virada às 22h) | 22:30 e 23:00 cobrem. |
| Quina sorteia às 20h em dias úteis (não cobre apenas 21:30?) | Já cobre — 21:30 é depois de 20h. |
| Cron job duplicado se rodar migration 2x | Migration usa `cron.unschedule` antes de `cron.schedule` (idempotente). |

### Arquivos tocados

- `supabase/migrations/<timestamp>_cron_precompute_safety_net.sql` (única mudança)

