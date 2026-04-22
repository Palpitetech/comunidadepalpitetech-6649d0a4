

# Varredura WhatsApp — Limpeza, Padronização e Otimizações

## Diagnóstico

**O que funciona bem:**
- 13 sub-tabs respondem; a sub-sidebar e os pills mobile estão consistentes.
- `ProxiesTab` (parser/dedupe) e `InstanciasTab` (CRUD/QR/swap proxy) estão sólidos.
- `RetargetingPanelTab` mostra schedule correto com countdown.
- Nenhum arquivo órfão dentro de `src/components/admin/whatsapp/` (todos os 16 arquivos são importados).
- Edge functions WhatsApp (`process-queue`, `warming-run`, `warming-manual`, `evolution-proxy`, `group-blast*`, `group-member-webhook`, `sync-group-members`, `process-lead-retargeting`) estão todas referenciadas e ativas.

**Problemas encontrados:**

### 1. Duplicação massiva entre 3 abas que leem `message_queue`
| Aba | Lê | Diferencial real |
|-----|----|------------------|
| **Fila** | `message_queue` ordenado por `scheduled_at` | Inserção manual + Processar Fila + Retentar |
| **Mensagens** | `message_queue` ordenado por `created_at` | Counters por status + busca por telefone + drawer detalhes |
| **Logs Templates** | `message_queue` filtrado por `template_id IS NOT NULL` | Filter pills + drawer detalhes |

As 3 abas duplicam: `QueueRow` interface, `StatusBadge`, `Field`, `fmtDate`, fetch de templates+instances. **Logs Templates é praticamente um subset de Mensagens.**

### 2. Componentes utilitários duplicados em 4+ arquivos
- `statusBadge` para mensagem (`sent`/`failed`/`sending`/`pending`) reescrito em `FilaTab`, `LogsTab`, `LogsTemplatesTab`, `MensagensTab`, `DisparoGrupoTab` → 5 cópias da mesma função.
- `Field`/`fmtDate` duplicados em `MensagensTab` e `LogsTemplatesTab`.
- `MetricCard`/`Tone`/`toneClass` duplicados entre `MensagensTab` (`CounterCard`) e `RetargetingPanelTab` (`MetricCard`).
- `maskIp` duplicado em `InstanciasTab` e `ProxiesTab`.
- `randomInt`/`delay` duplicados em `warming-run` e `warming-manual`.

### 3. Type-safety relaxado sem motivo
Várias queries usam `.from("message_queue" as any)` ou `.from("whatsapp_instances" as never)` mesmo quando os tipos já existem em `src/integrations/supabase/types.ts`. Espalha por `FilaTab`, `LogsTab`, `MensagensTab`, `LogsTemplatesTab`, `InstanciasTab`, `ProxiesTab`.

### 4. UX pequena
- `MensagensTab` está duplicada com `LogsTemplatesTab` (mesmo público interno, mesmo dado, dois lugares no menu).
- `FilaTab` em desktop é tabela e tem ainda Dialog "Novo Envio Manual" — esse fluxo já existe em `DisparoManualTab` de forma muito mais rica. O dialog de Fila é redundante.

## Plano de execução

### A. Criar utilitários compartilhados (sem quebrar nada)

Novos arquivos em `src/components/admin/whatsapp/shared/`:

1. **`MessageStatusBadge.tsx`** — único `<MessageStatusBadge status={...} variant="long" | "short" />` que cobre os 4 estados (`sent`/`failed`/`sending`/`pending`) e o `StatusDot`.
2. **`MetricCard.tsx`** — `<MetricCard icon label value tone active? onClick? />` reaproveitado por `MensagensTab` e `RetargetingPanelTab`. Inclui o helper `toneClass(tone)`.
3. **`Field.tsx`** — `<Field label value />` (label esquerda, valor direita com `border-b`).
4. **`format-date.ts`** — `fmtDate(d, format?)` com presets `"short"` (`dd/MM HH:mm`), `"full"` (`dd/MM/yy HH:mm`), `"time"` (`HH:mm`).
5. **`mask-ip.ts`** — única `maskIp(ip)`.
6. **`MessageDetailDialog.tsx`** — drawer compartilhado entre `MensagensTab` e `LogsTemplatesTab` (ou usado no que sobrar após consolidação — ver C).

### B. Refactor das abas existentes para consumir utilitários

Substituir nas 5 abas as cópias locais por imports dos novos utilitários. Sem mudar layout, sem mudar comportamento. Resultado esperado: ~-400 linhas redundantes.

### C. Consolidar Mensagens + Logs Templates → única aba "Mensagens"

`MensagensTab` já tem tudo que `LogsTemplatesTab` faz e mais:
- Counters (Aguardando/Enviando/Enviadas/Erro)
- Filtro por status + busca por telefone
- Drawer com variáveis e erro

**Mudança:**
- Adicionar em `MensagensTab` um pill toggle "Apenas templates" (filtra `template_id IS NOT NULL`) que cobre o caso de uso de "Logs Templates".
- Remover `LogsTemplatesTab.tsx` e o item `"logs-templates"` de `WhatsAppSubSidebar` + `TAB_TITLES` em `AdminWhatsApp.tsx`.

Resultado: 1 aba em vez de 2; menos confusão; mesma funcionalidade preservada.

### D. Enxugar `FilaTab`

`FilaTab` permanece, mas:
- **Remove** o dialog "Novo Envio Manual" (redundante com `DisparoManualTab`). Mantém só o botão "Processar Fila" e a lista filtrável.
- Renomeia o título para "Fila de Envio" e adiciona link visual "Para enviar para múltiplos contatos use Disparo Manual" no estado vazio.
- Usa o novo `MessageStatusBadge` e `fmtDate`.

Resultado: -150 linhas e fluxo claro (Fila = monitor + retry; Disparo = composição).

### E. Tipagem e correções sem risco

- Trocar `"message_queue" as any` por `"message_queue"` (tipo já existe em `types.ts`). Idem para `whatsapp_instances`, `whatsapp_proxies`, `send_logs`, `warming_schedule`, `warming_logs`. Mantém apenas `as never`/`as any` onde a tabela realmente não está nos tipos.
- Adicionar memoization (`useMemo`) em `MensagensTab.counts` e `RetargetingPanelTab.byDay`/`dailyRows` (recalculam a cada render hoje).
- `process-queue`: o retry-loop espera 60s síncronos quando não há instância — em produção isso ocupa o worker desnecessariamente. Substituir por **um único select e early-return `pending` se nenhuma disponível** (o cron já roda a cada minuto, então o retry natural acontece).

### F. Padronização de edge functions WhatsApp

Criar `supabase/functions/_shared/whatsapp-utils.ts` (Deno, importável por outras functions) com:
- `corsHeaders` padrão
- `randomInt(min, max)` / `delay(ms)`
- `getEvolutionEnv()` → retorna `{ url, key }` ou lança erro 500 padronizado
- `validateAdmin(req, supabase)` → padroniza o bloco de auth+role usado em `warming-manual` (e que pode ser reusado em `warming-run`).

Sem reescrever nada: as functions atuais permanecem, só passam a importar dali.

## Detalhes técnicos

**Arquivos novos:**
- `src/components/admin/whatsapp/shared/MessageStatusBadge.tsx`
- `src/components/admin/whatsapp/shared/MetricCard.tsx`
- `src/components/admin/whatsapp/shared/Field.tsx`
- `src/components/admin/whatsapp/shared/format-date.ts`
- `src/components/admin/whatsapp/shared/mask-ip.ts`
- `src/components/admin/whatsapp/shared/MessageDetailDialog.tsx`
- `supabase/functions/_shared/whatsapp-utils.ts`

**Arquivos editados (refactor):**
- `MensagensTab.tsx` — usa shared, ganha toggle "Apenas templates"
- `FilaTab.tsx` — remove dialog manual, usa shared
- `LogsTab.tsx` — usa shared
- `DisparoGrupoTab.tsx` — usa `MessageStatusBadge`
- `RetargetingPanelTab.tsx` — usa shared `MetricCard`
- `InstanciasTab.tsx`, `ProxiesTab.tsx` — usam shared `maskIp`
- `WhatsAppSubSidebar.tsx`, `AdminWhatsApp.tsx` — remove item `logs-templates`
- `process-queue/index.ts` — remove retry síncrono
- `warming-run/index.ts`, `warming-manual/index.ts`, `evolution-proxy/index.ts` — importam helpers compartilhados

**Arquivos removidos:**
- `src/components/admin/whatsapp/LogsTemplatesTab.tsx`

## O que NÃO vou mudar

- Nenhuma alteração nas tabelas/triggers/RPCs do banco.
- Nenhuma mudança de comportamento dos templates, fila, retargeting ou aquecimento.
- Sub-sidebar continua igual exceto pela remoção de "Logs Templates".
- Smart Links, Grupos, Disparo Manual, Disparo Grupo, Templates ficam intactos exceto por trocar o badge/utilitário.
- O servidor Evolution offline continua sendo só impossibilidade de chamar a API — o admin de instâncias/proxies/templates funciona normal localmente.

## Resultado esperado

- **~600 linhas a menos** entre os 3 arquivos de fila/mensagens/logs-templates.
- 1 ponto único para alterar visual de status badge / metric card / fmt date.
- 1 aba a menos no menu (Logs Templates fundido em Mensagens).
- Worker de `process-queue` libera mais rápido quando não há instâncias.
- Evolution helpers compartilhados entre 4 functions Deno.

