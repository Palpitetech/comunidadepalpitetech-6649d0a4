## Parte 4 — Logs no Monitor + Limpeza Final

### Arquivos a criar

**1. `src/hooks/useGroupBlastConfigs.ts`** — hook compartilhado entre `DisparoGrupoTab` e `MonitorGruposTab`.

```ts
// Hook compartilhado: busca group_blast_configs + slots normalizados.
export function useGroupBlastConfigs() {
  // useState configs, loading
  // fetchConfigs() → select * from group_blast_configs order by created_at desc
  //   normaliza c.slots = Array.isArray(c.slots) ? c.slots : []
  // useEffect → fetchConfigs() no mount
  // returns { configs, loading, refetch: fetchConfigs }
}
```

Tipo `BlastConfig` exposto pelo hook (campos relevantes: id, name, group_jids, slots, is_active, member_tag, palpite_settings, created_at, updated_at). Tipo definido no próprio hook e re-exportado.

### Arquivos a editar

**2. `src/components/admin/whatsapp/GroupBlastLogsCard.tsx`**
- Renomear título do card de `"Histórico de Envios"` → `"Histórico Detalhado de Envios"`. Nenhuma outra mudança.

**3. `src/components/admin/whatsapp/MonitorGruposTab.tsx`**
- Importar `useGroupBlastConfigs` e `GroupBlastLogsCard`.
- Chamar o hook para obter `configs`.
- Substituir o placeholder "Histórico Detalhado" por:
  ```tsx
  <GroupBlastLogsCard configs={configs.map((c) => ({ id: c.id, name: c.name }))} />
  ```

**4. `src/components/admin/whatsapp/DisparoGrupoTab.tsx`** — limpeza:
- Remover import `GroupBlastLogsCard`.
- Remover render `<GroupBlastLogsCard ... />` (linha 595).
- Remover estado `logs`, `statusFilter`, `configFilter`.
- Remover função `fetchLogs()`.
- Remover chamada `fetchLogs()` em `Promise.all` dentro de `fetchAll()` — agora `fetchAll = await fetchConfigs()`.
- Remover `setTimeout(() => fetchLogs(), …)` em `handleSendNow` e teste de slot — substituir por `toast` apenas (o usuário verá os logs no Monitor).
- Remover `filteredLogs`, `statusBadge` (não usados após limpeza).
- Remover interface local `BlastLog` se ficar órfã.
- Substituir `useState` + `fetchConfigs` interno pelo hook `useGroupBlastConfigs()` (mantém `lastLogs` que é diferente — é busca da última msg por config exibida nos cards).
- Remover qualquer `console.log`/`console.error` de debug (manter só toast.error para o usuário).
- Manter intacto: `GroupBlastScheduleCard` (mostra cron + botão reschedule, info operacional única não duplicada), todos os Card de config, dialogs, `lastLogs` por config, todos os handlers de salvar/editar/deletar/test/sync.

**5. `src/components/admin/whatsapp/monitor/index.ts`** — atualizar exports:
```ts
export { default as PipelineHealthCard } from "./PipelineHealthCard";
export { default as PrepareAuditTable } from "./PrepareAuditTable";
export { default as InstanceGroupMatrix } from "./InstanceGroupMatrix";
```
(Componentes existentes têm `export default`; ajustamos os exports nomeados aqui.)

**6. Adicionar comentário-cabeçalho em uma linha** no topo de cada componente novo do Monitor:
- `PipelineHealthCard.tsx`: `// 4 cards de saúde do pipeline (Prepare, Fila, Instâncias, Próximo Envio) com auto-refresh 60s.`
- `PrepareAuditTable.tsx`: `// Tabela dos 7 últimos runs do prepare, com expansão para mensagens de erro.`
- `InstanceGroupMatrix.tsx`: `// Matriz cruzada instâncias × grupos para auditar mapeamentos do disparo em grupo.`

### Sobre `GroupBlastScheduleCard` (Etapa 4.6)
Ele mostra: estado dos cron jobs (`pg_cron`), botão "Reagendar agora" e contagens de hoje (pending/sent/failed). As contagens de hoje **se sobrepõem** ao card "Fila" do PipelineHealth, mas o restante (cron schedule + botão de ação) é único e operacional — pertence à aba de configuração. **Decisão: manter na DisparoGrupoTab.** A duplicação de contagem é tolerável porque os contextos são diferentes (configurar vs monitorar) e a ação de reschedule fica perto das configs.

### Verificação (Etapa 4.5)
- `DisparoGrupoTab` sem nenhum `GroupBlastLogsCard`, sem `logs`/`fetchLogs`/filtros de log órfãos.
- `MonitorGruposTab` mostra os logs com filtros funcionando e botão "Reenviar" intacto (componente reutilizado sem mudanças funcionais).
- Hook `useGroupBlastConfigs` usado em ambas as abas — sem fetch duplicado.
- `monitor/index.ts` exporta os três componentes nomeados.
- Sem imports quebrados.

### Não muda
- Lógica do `GroupBlastLogsCard` (retry, filtros, render).
- `GroupBlastScheduleCard`.
- `PipelineHealthCard` / `PrepareAuditTable` / `InstanceGroupMatrix`.
