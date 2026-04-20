

## Variantes de Mensagem por Template (Anti-bloqueio)

### Objetivo
Cada template pode ter **até 10 variações de texto**. Quando o gatilho dispara, o sistema escolhe **1 variante por vez em rotação (round robin)** para evitar que o WhatsApp marque mensagens repetidas como spam.

---

## Etapa 1 — Schema + Backfill

### 1.1 Criar tabela `message_template_variants`
| Coluna | Tipo | Função |
|---|---|---|
| `id` | uuid PK | — |
| `template_id` | uuid FK → message_templates(id) ON DELETE CASCADE | dono |
| `content` | text | corpo da variante (mesmas variáveis do template) |
| `position` | int (1-10) | ordem fixa do round robin |
| `is_active` | bool | pausar variante específica sem apagar |
| `times_used` | int default 0 | métrica + critério de seleção |
| `last_used_at` | timestamptz | desempate |
| `created_at` | timestamptz | — |

**Constraints:** UNIQUE(template_id, position); CHECK(position BETWEEN 1 AND 10).

### 1.2 Adicionar `last_variant_position` em `message_templates`
- Coluna `int default 0` — guarda última posição usada (para round robin).

### 1.3 Adicionar `variant_id` em `message_queue`
- FK opcional para rastrear qual variante foi enfileirada (logs/auditoria).

### 1.4 Backfill — sem criar variantes para os atuais
Conforme pedido. Os 9 templates existentes continuam funcionando exatamente como hoje — quando não houver nenhuma variante ativa, o sistema usa o `content` do próprio template (fallback). Zero quebra.

### 1.5 Verificação da etapa
- Confirmar via `\d` que as 3 mudanças de schema existem.
- Confirmar que `SELECT * FROM message_template_variants` retorna 0 rows.

---

## Etapa 2 — Função de seleção (Round Robin)

### 2.1 Nova função `pick_template_variant(template_id) RETURNS uuid|null`
- Busca variantes ativas do template ordenadas por `position`.
- Retorna o `id` da próxima posição (round robin baseado em `last_variant_position`).
- Atualiza `times_used`, `last_used_at` na variante e `last_variant_position` no template.
- Retorna `null` se não houver nenhuma variante ativa (sinal para fallback no `content`).

### 2.2 Atualizar `queue_templates_for_event`
Substituir o INSERT atual por:
```sql
v_variant_id := public.pick_template_variant(v_template.id);
INSERT INTO message_queue (..., template_id, variant_id, ...)
VALUES (..., v_template.id, v_variant_id, ...);
```

### 2.3 Atualizar `process-queue` edge function
Em `sendMessage`:
```ts
if (item.variant_id) {
  const { data: variant } = await supabase
    .from("message_template_variants")
    .select("content").eq("id", item.variant_id).single();
  messageText = variant?.content ?? template.content; // fallback
}
messageText = resolveTemplate(messageText, item.variables ?? {});
```

### 2.4 Verificação da etapa
- Teste manual: inserir 3 variantes em 1 template, disparar 6 vezes, conferir distribuição (2-2-2).
- Verificar `last_variant_position` avançando 1→2→3→1.

---

## Etapa 3 — UI Admin (TemplatesTab)

### 3.1 Botão "Variantes" no card do template
Novo botão entre "Editar" e "Testar" — mostra contador `(3/10)`.

### 3.2 Novo `VariantsDialog` (componente separado)
Layout limpo dentro de Dialog:
- **Lista** das variantes existentes com:
  - Posição (#1, #2…)
  - Preview do conteúdo (2 linhas truncadas)
  - Métrica `Enviada N vezes`
  - Switch ativo/pausado
  - Botão editar (textarea inline) e excluir
- **Botão "+ Adicionar variante"** desabilitado quando atinge 10
- Mesmo painel de inserir variáveis `{{nome}} {{produto}}` etc.
- Aviso visual: "Use variações que falem o mesmo conteúdo de formas diferentes"

### 3.3 Indicador visual no card do template
Badge pequeno: `🔁 3 variantes` quando `> 0`. Quando `= 0`, badge cinza `Sem variantes` (claramente opcional, não bloqueia uso).

### 3.4 Verificação da etapa
- Criar 2 variantes via UI, testar via "Testar envio" → deve alternar entre as 2.
- Editar variante → mudança refletida na próxima fila.
- Excluir variante → round robin pula posição vazia.

---

## Etapa 4 — Refatoração e limpeza

### 4.1 Código morto identificado para remover
- Em `process-queue/index.ts`: lógica condicional `item.template_id ? template : free_message` continua, mas extrair função `resolveMessageText(item)` para ficar legível.
- Em `TemplatesTab.tsx`: extrair `EVENT_MASKS` + `getEventLabel` para `src/lib/whatsapp-event-labels.ts` (já é usado em outros 2 arquivos — DRY).

### 4.2 Tipos
- Adicionar `MessageTemplateVariant` em `src/types/whatsapp.ts` (ou criar arquivo se não existir) — único ponto de verdade do shape.

### 4.3 Validação
- Função SQL `pick_template_variant` com `EXCEPTION WHEN OTHERS` retornando NULL (não quebra fluxo principal).
- Frontend: limite hard de 10 variantes (botão desabilitado + check no submit).

### 4.4 Verificação final
1. Template SEM variantes → continua disparando o `content` original ✅
2. Template COM 1 variante → sempre usa essa variante
3. Template COM N variantes → distribui igualmente
4. Pausar 1 variante → round robin pula automaticamente
5. Excluir template → variantes deletam em cascata
6. Edge function não quebra se `variant_id` não existir mais (fallback)

---

## Resumo dos arquivos editados

| Arquivo | Ação |
|---|---|
| Migração SQL nova | Cria tabela `message_template_variants`, adiciona `last_variant_position` e `variant_id`, RLS, função `pick_template_variant`, atualiza `queue_templates_for_event` |
| `supabase/functions/process-queue/index.ts` | Resolve `variant_id` antes de enviar |
| `src/components/admin/whatsapp/TemplatesTab.tsx` | Botão + indicador de variantes; extração de `EVENT_MASKS` |
| `src/components/admin/whatsapp/VariantsDialog.tsx` | **Novo** — CRUD de variantes |
| `src/lib/whatsapp-event-labels.ts` | **Novo** — extraído do TemplatesTab |
| `src/types/whatsapp.ts` | Adiciona `MessageTemplateVariant` |

## Fora de escopo
- Sem criação automática de variantes para templates antigos (conforme pedido).
- Sem geração por IA de variações (pode ser próximo ciclo).
- Sem mudança no `should_send_template` nem nas tags/segmentação.
- Sem mudanças em disparo manual (`useDisparoManual`) — variantes só se aplicam a Templates de evento.

## Resultado esperado
- Cada template pode ter de 0 a 10 variantes; round robin natural.
- Templates atuais continuam funcionando sem nenhuma alteração visual ou de fluxo.
- Risco de bloqueio do WhatsApp por mensagens idênticas reduzido drasticamente.

