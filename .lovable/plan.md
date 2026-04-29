
## Bug confirmado por simulação

A função `brTimeToScheduledUtc` em `supabase/functions/_shared/group-blast/schedule.ts:18-35` usa `now.getUTCDate()` como base do dia. Isso quebra na janela **00:00–03:00 UTC** (= 21:00–00:00 BRT do dia anterior), porque o "dia UTC atual" é o dia **seguinte** ao "dia BRT atual".

### Exemplo numérico real

Cron rodando às **00:30 UTC** (= 21:30 BRT do dia anterior), slot configurado para **22:00 BRT**:
- Código calcula: `Date.UTC(2026, 3, 30, 25, 0)` = **01/05 01:00 UTC** = 30/04 22:00 BRT
- Correto seria: 29/04 22:00 BRT = 30/04 01:00 UTC (30 min no futuro)
- **Erro: agenda 24h atrasado** ❌

### Janela afetada
- 6 ticks do cron `group-blast-prepare` por dia (rodam 21:00, 21:30, 22:00, 22:30, 23:00, 23:30 BRT)
- Atinge slots configurados entre **21:00–23:59 BRT** — exatamente os horários com mais disparos no seu sistema (23:30, 23:32, 23:40, 23:48, 23:53...)

## Plano de correção

### Refatorar `brTimeToScheduledUtc` para usar dia BRT explícito

Substituir o cálculo baseado em `getUTCDate()` por: calcular o "dia BRT atual" via offset −3h, depois converter o slot BRT desse dia para UTC somando +3h. Sempre que o resultado for ≤ now, somar 24h.

```typescript
function brTimeToScheduledUtc(hh: string, mm: string): Date {
  const now = new Date();
  // "Agora" no relógio BRT (UTC-3, sem horário de verão desde 2019)
  const nowBrt = new Date(now.getTime() - 3 * 3600 * 1000);
  // Componentes do dia BRT atual
  const brtY = nowBrt.getUTCFullYear();
  const brtM = nowBrt.getUTCMonth();
  const brtD = nowBrt.getUTCDate();
  // Converte slot BRT do dia BRT atual → UTC somando +3h
  let scheduled = new Date(Date.UTC(
    brtY, brtM, brtD,
    parseInt(hh) + 3, parseInt(mm), 0, 0,
  ));
  // Se já passou (mesmo dentro do mesmo dia BRT), agenda para amanhã
  if (scheduled.getTime() <= now.getTime()) {
    scheduled = new Date(scheduled.getTime() + 24 * 60 * 60 * 1000);
  }
  return scheduled;
}
```

Por que funciona: agora o "dia base" é o dia **do relógio BRT**, não o dia UTC. O construtor `Date.UTC` já normaliza overflow de hora (ex: hora 26 vira "dia+1, 02h"), então a soma `+3` continua segura para slots noturnos.

### Validação

Re-rodar a mesma bateria de simulação (já fiz 9 cenários incluindo meia-noite UTC, virada de mês e virada de ano). Esperado: todos os casos passam, resultado bate com BRT esperado em todos.

### Sobre criar novos cron jobs

**Não é necessário.** O bug não está no cron — está na conversão. O cron atual (`*/30 * * * *` para prepare, `* * * * *` para send) é adequado. Adicionar mais crons só mascararia o bug e geraria duplicatas (apesar do dedup, seria desperdício de invocações). A correção raiz na função resolve 100% dos casos.

### Sobre horário de verão

Brasil aboliu o horário de verão em 2019. O `+3` hardcoded está correto **hoje**. Se voltar, basta trocar pela API `Intl.DateTimeFormat` que calcula o offset dinamicamente. Não vou refatorar agora — risco baixo, ganho zero hoje.

## Impacto pós-correção

- Disparos da janela 21:00–23:59 BRT vão sair **no dia certo**
- Logs históricos com erro não serão recuperados (já passaram), mas a partir do próximo `prepare` tudo fica correto
- Nenhum schema change, nenhum cron novo — só 1 função pequena editada
