## Parte 2 — Pipeline Health (Seção 1)

Objetivo: 4 cards no topo da aba Monitor Grupos com leitura instantânea da saúde do pipeline (Prepare, Fila, Instâncias, Próximo Envio). Auto-refresh 60s. Usa dados reais do banco.

### Arquivos a criar

**1. `src/lib/dateUtils.ts`** — utilitários BRT reutilizáveis nas próximas partes:
- `formatBRT(iso)` → `"hoje às 23:01"` / `"ontem às 14:32"` / `"12/03 às 09:15"`, via `Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" })`.
- `timeAgoBRT(iso)` → `"agora"` / `"há 12 min"` / `"há 3h"` / `"há 2d"`.
- `currentHourBRT()` → hora atual (0–23) em BRT.
- `todayBRT()` / `toBRTDate(iso)` → `YYYY-MM-DD` em BRT.

**2. `src/components/admin/whatsapp/monitor/healthStatus.ts`** — helpers visuais:
- Tipo `HealthStatus = "ok" | "warn" | "critical" | "neutral"`.
- `getHealthStyle(status)` → `{ badgeClass, borderClass, label }` com classes Tailwind padronizadas (`bg-green-100/text-green-800`, `border-l-green-500`, etc.) — mesma paleta usada nas Partes 3–5.
- `getHealthByThreshold(value, { warn, critical })` → utilitário genérico.

**3. `src/components/admin/whatsapp/monitor/PipelineHealthCard.tsx`** — componente principal.

Layout:
- Container `grid grid-cols-2 lg:grid-cols-4 gap-3`.
- Cada card usa `Card` shadcn com `border-l-4 ${borderClass}`.
- Header do card: ícone (h-4 w-4) + título (`text-xs font-medium text-muted-foreground uppercase tracking-wide`) à esquerda, badge de status à direita (`Badge` com `badgeClass`).
- Botão refresh global (RefreshCw) no canto direito do header da seção (não em cada card individual — fica mais limpo). Spinner durante fetch.
- Corpo: número principal `text-2xl font-bold` + linha secundária `text-xs text-muted-foreground`.

Fontes de dados (via `supabase` client):

| Card | Query | Status |
|------|-------|--------|
| **Prepare** | `group_blast_prepare_runs` order by `ran_at` desc limit 1 | `ok` se `ran_at` é hoje BRT após 03:00; `critical` se hora BRT ≥ 5 e não rodou hoje; senão `warn`. Principal: `slots_scheduled`. Secundário: `formatBRT(ran_at)` |
| **Fila** | `group_blast_logs` filtro `created_at >= todayBRT 00:00 UTC-3` agrupado por status (faz 1 select com `status, scheduled_for` e conta no client) | Principal: `pending` agora. Secundário: `X enviados` (verde) e `X falhas` (vermelho). `critical` se pending > 10 com `created_at` há > 30 min; `warn` se failed > 0; `ok` caso contrário. |
| **Instâncias** | `whatsapp_instances` select `id, friendly_name, status` | Principal: `X / Y online` (status === "open" conta como online). Lista nomes offline (até 3, depois "+N mais") em `text-xs text-red-600`. `critical` se 0 online; `warn` se alguma offline; `ok` se todas. |
| **Próximo Envio** | `group_blast_logs` filtro `status='pending' and scheduled_for > now()` order asc limit 1, join leve via `config_id` lookup em `group_blast_configs(name)` (segunda query simples) | Principal: `formatBRT(scheduled_for)`. Secundário: `${configName} · ${groupJid.slice(-12)}`. `warn` (laranja) se nenhum agendado para hoje BRT; `ok` caso contrário. |

Comportamento:
- `useEffect` faz fetch inicial; `setInterval(fetchAll, 60_000)` com `clearInterval` no cleanup.
- Estado `loading` para o botão refresh; estado `lastUpdated` exibido em `text-[10px] text-muted-foreground` ao lado do botão (`atualizado ${timeAgoBRT}`).
- Erros de fetch tratados com `try/catch` e `toast.error` (sonner) — mantém UI funcionando.
- Sem `console.log`.

### Arquivos a editar

**4. `src/components/admin/whatsapp/MonitorGruposTab.tsx`**
- Importar `PipelineHealthCard`.
- Substituir o card placeholder "Pipeline Health" pelo `<PipelineHealthCard />` (mantém os outros 3 placeholders).
- Como `PipelineHealthCard` já renderiza seu próprio cabeçalho com título + refresh, o slot da seção é apenas o componente em si (sem `Card` extra envolvendo).

### Verificação (Etapa 2.4)
- Os 4 cards mostram dados reais (Prepare conta 12 slots conforme execução recente).
- Mobile (2×2) e desktop (4×1) renderizam corretamente.
- Cores mudam conforme thresholds.
- Botão refresh recarrega todos os cards; auto-refresh ocorre a cada 60s.
- Cleanup do interval no unmount (sem warning de memory leak).

### Refatoração (Etapa 2.5)
- `dateUtils.ts` e `healthStatus.ts` ficam disponíveis para Partes 3–5.
- Sem `console.log`. Todo `useEffect` com cleanup.
- `supabase` importado direto de `@/integrations/supabase/client` (não passado como prop — segue padrão do resto do admin).

### Não faz parte desta parte
- Auditoria do Prepare, Instâncias × Grupos e Histórico Detalhado seguem como placeholders "Em construção…" — Partes 3, 4 e 5.
