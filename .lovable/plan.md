## Parte 3 — Auditoria do Prepare + Matriz Instâncias × Grupos

### Arquivos a criar

**1. `src/components/admin/whatsapp/monitor/PrepareAuditTable.tsx`**

Busca dos últimos 7 runs de `group_blast_prepare_runs`:
- Query principal: `select id, ran_at, config_id, slots_scheduled, slots_resolved, slots_failed_resolution, skipped_dedup, error_message order by ran_at desc limit 7`.
- Resolução de nome da config: segunda query em `group_blast_configs` com `.in('id', configIds)` (mais simples que JOIN; runs com `config_id` nulo aparecem como "Global").
- Reutiliza `formatBRT` da Parte 2.

UI:
- `Card` shadcn com header (título + subtítulo "Últimos 7 runs do prepare" + botão refresh com spinner).
- `Table` com colunas: chevron expand · Data/hora · Config · Agendados (right) · Dedup (right) · Status (centro).
- Status badge: verde "OK" (`CheckCircle2`) se `slots_scheduled > 0 && !error_message`; senão vermelho "Falha" (`XCircle`).
- Linha com `slots_scheduled === 0` recebe `bg-red-50`.
- Linhas com `error_message` ficam clicáveis (`cursor-pointer`); ao clicar, expande uma sub-row mostrando o erro completo (`whitespace-pre-wrap`) + contador de `slots_failed_resolution` se > 0.
- Estado vazio: "Nenhum run registrado".

**2. `src/components/admin/whatsapp/monitor/InstanceGroupMatrix.tsx`**

Fetches em paralelo via `Promise.all`:
- `whatsapp_instances` → `id, friendly_name, name, status, last_message_at` ordenado por nome.
- `group_blast_configs` ativas → `group_jids`; agrega num `Set<string>` de JIDs únicos, ordenado.
- `whatsapp_instance_groups` → `instance_id, group_jid`; vira `Set<"${instId}::${jid}">` para lookup O(1).

UI:
- `Card` com refresh button.
- `Table` com primeira coluna fixa (instância) e uma coluna por JID. JID exibido truncado (`…últimos 10 chars` sem `@g.us`) com `Tooltip` mostrando o JID completo.
- Primeira coluna mostra: badge de status (via `getHealthStyle`) + nome (`friendly_name || name`) + `último envio ${formatBRT(last_message_at)}` em texto pequeno.
- Status mapping: `"open"` → ok; `"close"`/`"closed"`/null → critical; outros → warn.
- Célula da matriz: `Check` verde quando mapeada, `·` cinza-claro quando não.
- Linha inteira com `bg-red-50` se status !== ok.
- Rodapé do card: "Instâncias offline não recebem novos envios."
- Estados vazios para "nenhum grupo configurado" e "nenhuma instância cadastrada".

### Arquivos a editar

**3. `src/components/admin/whatsapp/MonitorGruposTab.tsx`**
- Importar `PrepareAuditTable` e `InstanceGroupMatrix`.
- Substituir os placeholders das seções 2 e 3 (PrepareAuditTable acima, InstanceGroupMatrix abaixo).
- Manter placeholder "Histórico Detalhado" para Parte 5.

### Verificação (Etapa 3.4)
- Audit mostra 7 runs com formatação BRT correta.
- Linhas com erro expandem ao clicar.
- Linhas com 0 agendados em vermelho.
- Matriz lista todas instâncias × todos os JIDs ativos; checks batem com `whatsapp_instance_groups`.
- Tooltip exibe JID completo no hover do header.
- Instâncias offline destacadas em vermelho.

### Refatoração (Etapa 3.5)
- `formatBRT` reutilizado (não há duplicação).
- `getHealthStyle` reutilizado para os badges das instâncias.
- `GroupBlastScheduleCard` não consulta `whatsapp_instances` — não há lógica duplicada, então **não é necessário** criar `useWhatsappInstances()`.
- Sem `console.log`, sem imports não usados.
