
# Parte 5 — Revisão Geral (Resultado da Auditoria)

Fiz a varredura ponto a ponto pedida nas etapas 5.1–5.6. A maior parte está conforme. Encontrei **3 itens menores** que merecem ajuste antes de fechar a Parte 5. Tudo o resto passou.

---

## Resultado por etapa

### 5.1 — Visual ✅
- Ordem correta no `MonitorGruposTab`: **Pipeline Health → Auditoria do Prepare → Instâncias × Grupos → Histórico Detalhado**.
- Cores consistentes: todos os componentes derivam de `getHealthStyle()` em `monitor/healthStatus.ts` (verde/laranja/vermelho/cinza).
- Grids responsivos (`grid-cols-2 lg:grid-cols-4` no Health, `overflow-x-auto` nas tabelas).
- Tooltip nos JIDs truncados da matriz funciona via `TooltipProvider`.

### 5.2 — Dados ✅
- `PipelineHealthCard`: lê `group_blast_prepare_runs`, `group_blast_logs` (janela BRT correta), `whatsapp_instances` e próximo pendente — coerente.
- `PrepareAuditTable`: `LIMIT 7` por `ran_at desc`, com JOIN manual em `group_blast_configs` para o nome.
- `InstanceGroupMatrix`: 3 queries (instâncias, configs ativas, mapeamentos) — sem N+1.
- `GroupBlastLogsCard`: filtros aplicados na query (status, config, datas) com `LIMIT 100`.

### 5.3 — Duplicidades ⚠️ (1 ajuste)
- `group_blast_configs` é lido em 4 lugares, **mas todos com propósito legítimo**:
  - `useGroupBlastConfigs` (lista completa para Disparo + Monitor) ✅
  - `PrepareAuditTable` (apenas `id, name` por `IN (...)` para JOIN) ✅
  - `InstanceGroupMatrix` (apenas `group_jids` de configs ativas) ✅
  - `PipelineHealthCard` (apenas `name` de 1 config — `eq(id, ...)`) ✅
- Formatação BRT centralizada em `@/lib/dateUtils` ✅
- `getHealthStyle` reutilizado no Pipeline e na Matriz ✅
- `GroupBlastLogsCard` **não está mais** na `DisparoGrupoTab` ✅
- **⚠️ Ajuste 1:** `GroupBlastLogsCard` ainda tem um mini-bloco interno de "auditoria do último prepare" (linhas 112–169 — `fetchLastRun` + Card pontilhado no topo). Isso agora **duplica** o `PrepareAuditTable` no Monitor. Remover o `lastRun`/`fetchLastRun` desse componente.

### 5.4 — Performance ✅ (1 observação)
- `setInterval` só existe no `PipelineHealthCard` e tem `clearInterval` no cleanup ✅
- `InstanceGroupMatrix` faz exatamente 3 queries (Promise.all) ✅
- `GroupBlastLogsCard` pagina em 100 com aviso de truncagem ✅
- **⚠️ Ajuste 2:** `DisparoGrupoTab` faz N queries em loop para popular `lastLogs` (uma `select` por config, linhas 109–123). Para 5+ configs vira fetch sequencial desnecessário. Trocar por **1 query** com `.in("config_id", ids)` e agrupar no cliente.

### 5.5 — Manutenibilidade ✅ (1 ajuste)
- Header de propósito presente em todos os arquivos novos ✅
- Props tipadas em todos os componentes do `monitor/` ✅
- `monitor/index.ts` exporta os 3 cards ✅
- **⚠️ Ajuste 3:** `MonitorGruposTab` importa via caminhos relativos (`./monitor/PipelineHealthCard`) em vez do barrel `./monitor`. Trocar para o barrel (consistência + facilita futuros movimentos).

### 5.6 — Checklist final
| Item | Status |
|------|--------|
| Aba "Monitor Grupos" no menu (entre Disparo Grupo e Aquecimento) | ✅ |
| 4 cards de saúde com cores e dados reais | ✅ |
| Auditoria com 7 runs e erros expansíveis | ✅ |
| Matriz instâncias × grupos completa | ✅ |
| Logs com filtros e Reenviar | ✅ |
| `DisparoGrupoTab` sem `GroupBlastLogsCard` | ✅ |
| Hook `useGroupBlastConfigs` em uso | ✅ |
| Zero `console.log` de debug nos arquivos novos | ✅ (verificado com `rg`) |
| Build sem erros | ✅ (sem mudanças desde a última build) |

---

## Plano de ajustes (mudanças pequenas)

### Ajuste 1 — `GroupBlastLogsCard.tsx`
Remover do componente:
- Interface `PrepareRun`
- Estado `lastRun` e função `fetchLastRun`
- Chamada de `fetchLastRun()` no `useEffect`
- Botão "Atualizar" também não precisa mais chamar `fetchLastRun`
- Bloco JSX do Card pontilhado (linhas 149–169)

Justificativa: `PrepareAuditTable` no Monitor já mostra os 7 últimos runs com mais detalhe.

### Ajuste 2 — `DisparoGrupoTab.tsx` (`useEffect` de `lastLogs`)
Substituir o loop por uma única query:
```ts
const ids = configs.map(c => c.id);
const { data } = await supabase
  .from("group_blast_logs")
  .select("*")
  .in("config_id", ids)
  .order("created_at", { ascending: false });
// reduzir para o mais recente por config_id no cliente
```

### Ajuste 3 — `MonitorGruposTab.tsx`
Trocar 3 imports relativos por:
```ts
import { PipelineHealthCard, PrepareAuditTable, InstanceGroupMatrix } from "./monitor";
```

---

## Fora do escopo (apenas registrado)
- `GroupBlastScheduleCard` permanece **só** na `DisparoGrupoTab` (operacional: "Reagendar agora"). Não duplica nada do Monitor — mantido como decidido na Parte 4.
- `DisparoGrupoTab` ainda tem um `setLoading` redundante espelhando `configsLoading` (ruído mínimo, deixar para uma futura limpeza maior do arquivo).

Aprovando este plano, aplico os 3 ajustes em uma única passagem e a Parte 5 fica fechada.
