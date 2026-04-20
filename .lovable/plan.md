

## Refatorar UX/UI das variantes — seletor inline no dialog do template

### Objetivo
Eliminar o botão 🔁 separado e o `VariantsDialog`. Trazer a edição das 10 variantes para **dentro do dialog "Novo/Editar Template"**, num seletor horizontal acima do textarea (1 a 10), onde a posição #1 = mensagem principal do template e #2-#10 = variantes.

---

### Como o usuário vai ver

```
┌─ Novo Template ──────────────────────────────┐
│ Nome: [______________]                       │
│ Evento: [▼ Compra aprovada]                  │
│ Delay: [○]                                   │
│                                              │
│ ── Conteúdo da mensagem ──                   │
│ Variação ativa:                              │
│ [ 1 ][ 2 ][ 3 ][ + ][ + ][ + ]...[ + ]       │
│  ↑ ativa  ↑ vazia (clicar pra criar)         │
│                                              │
│ [textarea da variação atual...........]      │
│ {{nome}} {{telefone}} {{email}} {{produto}}  │
│ [Pausar variação] [Excluir variação]         │
│                                              │
│ ── Segmentação ──                            │
│ ...                                          │
│ [Salvar Template]                            │
└──────────────────────────────────────────────┘
```

**Comportamento do seletor:**
- 10 slots numerados em linha (responsivo: wrap em mobile)
- Slot #1 sempre existe = `message_templates.content` (mensagem principal)
- Slots #2-#10 = registros em `message_template_variants`
- Slot preenchido: número + cor sólida (verde se ativo, âmbar se pausado)
- Slot vazio: ícone `+` discreto, clique = cria nova variação naquela posição
- Slot ativo (selecionado): ring/borda destacada
- Tooltip ao passar mouse: "Enviada N×" + status

---

### Mudanças por arquivo

#### 1. `src/components/admin/whatsapp/TemplatesTab.tsx`
- **Remover:**
  - Import e estado de `VariantsDialog` (`variantsDialogTpl`)
  - Botão 🔁 do card (linha 519-527)
  - Tag `<VariantsDialog .../>` no fim (linha 576-591)
  - Import `Repeat` do lucide se não for mais usado no card (mantém para o badge "N/10 variantes")
- **Manter:** Badge `N/10 variantes` no card (apenas leitura, sem ação)
- **Refatorar form:** o estado `form.content` deixa de ser o conteúdo único — passa a ser parte de um array virtual de slots. Carregar variantes ao abrir edit; criar/editar/pausar/excluir variantes via mesmas chamadas de Supabase no salvar.

#### 2. Novo componente `src/components/admin/whatsapp/VariantSlotSelector.tsx`
Componente puro, recebe:
```ts
interface Props {
  slots: Array<{ position: number; content: string; isActive: boolean; timesUsed: number; exists: boolean }>;
  activeSlot: number; // 1-10
  onSelect: (position: number) => void;
  onCreate: (position: number) => void;
}
```
Renderiza fileira de 10 botões. Acessível (aria-label, focus ring), 44px tap-target em mobile.

#### 3. `src/components/admin/whatsapp/TemplatesTab.tsx` — novo bloco no dialog
Substituir o atual "Conteúdo da mensagem" (linhas 417-440) por:
- Label "Conteúdo da mensagem (até 10 variações)"
- `<VariantSlotSelector />` 
- Textarea ligado ao slot ativo
- Botões "Pausar/Ativar variação" e "Excluir variação" — desabilitados quando `activeSlot === 1` (slot principal não pode ser excluído nem pausado individualmente)
- Contador `{content.length}/2000`

#### 4. Salvamento (`handleSave`)
Lógica passa a ser:
1. Salva o template (insert/update) com o `content` do slot #1.
2. Itera slots 2-10:
   - Slot novo com conteúdo → INSERT em `message_template_variants`
   - Slot existente alterado → UPDATE
   - Slot existente esvaziado/marcado pra excluir → DELETE
3. Refetch templates + counts.

Tudo em transação lógica (try/catch + toast único).

#### 5. Carregamento ao editar
`openEdit(t)` agora:
- Busca variantes do template (`SELECT ... WHERE template_id = ? ORDER BY position`)
- Monta array de 10 slots
- Reseta `activeSlot = 1`

#### 6. Deletar — `src/components/admin/whatsapp/VariantsDialog.tsx`
**Excluir o arquivo inteiro.** Não é mais usado.

#### 7. Limpeza/refatoração
- Remover import `VariantsDialog` do TemplatesTab.
- `MessageTemplateVariant` em `src/types/whatsapp.ts` continua válido (usado pelo novo componente e pelo edge function `process-queue`).
- Sem mudanças em `whatsapp-event-labels.ts`, `process-queue/index.ts`, schema do banco, ou função `pick_template_variant`. **Backend continua exatamente igual** — só muda a UI de gestão.
- Verificar via grep se há outros consumers de `VariantsDialog` (não deve haver).

---

### Validação pós-deploy
1. Abrir template existente sem variantes → vê só slot #1 preenchido e #2-#10 com `+`.
2. Clicar em #2 vazio → cria variação, escreve texto, salva → `message_template_variants` recebe row position=2.
3. Trocar entre slots preserva edições não salvas no estado local.
4. Excluir variação #3 → próxima abertura mostra slot #3 como vazio (não promove #4 para #3 — posições são fixas, conforme spec original do round robin).
5. Pausar variação → `is_active=false` no banco; `pick_template_variant` continua pulando (já implementado).
6. Card no grid mostra `N/10 variantes` correto.

### Fora de escopo
- Nenhuma mudança em backend (RPC, edge functions, migrações).
- Nenhuma mudança no fluxo de envio / round robin.
- Sem geração por IA (próximo ciclo).

### Resultado
- 1 único dialog para gerir template + variantes (zero context switch)
- Botão extra removido do card
- Componente reutilizável `VariantSlotSelector`
- `VariantsDialog.tsx` apagado → menos código para manter

