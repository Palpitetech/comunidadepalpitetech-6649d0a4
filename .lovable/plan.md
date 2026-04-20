

# Refatorar visual do Sidebar Admin colapsado — corrigir ícones cortados

## Problema observado
Na imagem o sidebar colapsado mostra os ícones **cortados pela metade** na borda direita e alguns "fantasmas" (esmaecidos / invisíveis embaixo). Causas:

1. **Largura insuficiente**: `--sidebar-width-icon = 3rem` (48px), mas o botão `size-8` (32px) + padding horizontal do `SidebarGroup` (`p-2` = 8px+8px) = 48px → encosta na borda; com qualquer ajuste de borda, sobra recortado.
2. **Texto não escondido**: o `<span>` dentro de cada `Link` continua no DOM com `flex gap-2` empurrando o ícone para a esquerda; o `truncate` não esconde, só corta — por isso parece que metade do ícone "vaza".
3. **Ícones "fantasmas"** no fim (Custos, Vendas): são na verdade os ícones do grupo "Financeiro" empurrados para baixo com opacidade herdada do `Collapsible` em estado `data-state=closed` que ainda renderiza (animação) — somado ao item 2 acima.

---

## Como vai ficar (mockup)

```text
ANTES (cortado)              DEPOIS (centrado, limpo)
┌──┐                         ┌────┐
│⌘╵│ ← cortado               │ ⌘  │ ← centrado, 40px
│📄│                         │ 📄 │
│👥│                         │ 👥 │
│🤖│                         │ 🤖 │
│🎁│                         │ 🎁 │
│..│ ← fantasma              │ ── │ ← divisor de grupo
│..│                         │ 💲 │ ← grupo Financeiro (clicável)
└──┘                         │ 🎫 │ ← grupo Bolões
                             │ 🎥 │ ← grupo Gravação
                             └────┘
```

---

## Mudanças concretas

### 1. Aumentar largura do sidebar colapsado
**Arquivo:** `src/components/ui/sidebar.tsx`
- `SIDEBAR_WIDTH_ICON`: `"3rem"` (48px) → **`"3.5rem"` (56px)**
- Garante folga de 8px de cada lado para um botão de 40x40, evitando qualquer corte e dando alvo de toque maior (≥44px conforme guideline sênior).

### 2. Ajustar o botão colapsado para 40x40 e centralizar
**Arquivo:** `src/components/ui/sidebar.tsx` (variants do `sidebarMenuButtonVariants`, linha ~415)
- Alterar `group-data-[collapsible=icon]:!size-8` → **`group-data-[collapsible=icon]:!size-10`**
- Adicionar `group-data-[collapsible=icon]:!justify-center` para centralizar o ícone
- Aumentar ícone: adicionar `group-data-[collapsible=icon]:[&>svg]:size-5` (20px → mais legível)

### 3. Esconder os spans de texto quando colapsado (corrige "ícone empurrado")
**Arquivo:** `src/components/ui/sidebar.tsx` (mesmo `cva`)
- Adicionar `group-data-[collapsible=icon]:[&>span]:hidden` no `sidebarMenuButtonVariants`
- Resultado: span desaparece do layout, ícone fica realmente sozinho e centralizado

### 4. Corrigir o `AdminSidebar` — não renderizar Collapsible quando colapsado
**Arquivo:** `src/components/layout/AdminSidebar.tsx`
- Hoje quando colapsado, o componente `NavGroup` retorna corretamente o Popover (já refatorado), mas **o cabeçalho do grupo expandido (Collapsible) ainda existe na DOM em outras partes**. Vou validar e garantir que:
  - Quando `collapsed === true`, **nenhum** `Collapsible`/`CollapsibleTrigger` é montado.
  - O `SidebarGroupLabel` "Admin" (texto) já tem condicional `{!collapsed && ...}` — manter.
  - Reduzir padding lateral do `SidebarGroup` no estado colapsado: adicionar classe `group-data-[collapsible=icon]:!px-1` no wrapper para dar mais espaço ao botão de 40px.

### 5. Padding ajustado nos grupos
**Arquivo:** `src/components/ui/sidebar.tsx` (`SidebarGroup` ~linha 360)
- Adicionar `group-data-[collapsible=icon]:px-1.5` no padding do `SidebarGroup` para que com 56px de sidebar - 12px de padding = 44px de área útil → comporta confortavelmente o botão 40px.

### 6. Separadores visuais entre grupos quando colapsado
**Arquivo:** `src/components/layout/AdminSidebar.tsx`
- Adicionar um `<div className="h-px bg-sidebar-border mx-2 my-1" />` entre os grupos (Main / Financeiro / Bolões / Gravação) **somente quando colapsado** — assim o usuário identifica visualmente que existem 4 blocos sem precisar abrir.

### 7. Tooltip imediato (sem delay)
**Arquivo:** `src/components/layout/AdminSidebar.tsx`
- Hoje `delayDuration={200}` no `TooltipProvider`. Reduzir para `delayDuration={100}` para feedback mais ágil ao passar o mouse (melhor descoberta dos itens).

---

## Detalhes técnicos sensíveis

- `SIDEBAR_WIDTH_ICON` é uma CSS variable usada em vários lugares (`group-data-[collapsible=icon]:w-[--sidebar-width-icon]`, etc.). Mudar de 3rem → 3.5rem propaga automaticamente.
- O `sidebarMenuButtonVariants` é compartilhado com o sidebar do site público — verificar se há outros sidebars usando o componente (AdminSidebar é o único em `/admin`, então mudanças não afetam UX do app principal pois ele não usa esse padrão de sidebar).
- Não vou tocar no `SidebarTrigger` nem na lógica do `Popover` (já funcional).

---

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/components/ui/sidebar.tsx` | **Editar** — `SIDEBAR_WIDTH_ICON` 3rem→3.5rem, `sidebarMenuButtonVariants`: size-10, justify-center, esconder spans, ícone size-5; padding px-1.5 no `SidebarGroup` colapsado |
| `src/components/layout/AdminSidebar.tsx` | **Editar** — separadores entre grupos no estado colapsado, `delayDuration={100}` no Tooltip, garantir que Collapsible só monta quando expandido |

## Fora de escopo
- Mudar o sidebar do site público (não compartilha esse padrão visual)
- Refatorar a lógica de Popover (já funciona)
- Adicionar novos itens de menu

## Resultado esperado
- Sidebar colapsado **56px** de largura (era 48px)
- Botões **40x40 centralizados**, ícones **20px** (era 16px) — totalmente visíveis, sem corte
- **Sem texto fantasma** empurrando ícones
- **Divisores sutis** entre grupos identificam blocos visualmente
- Tooltip aparece **mais rápido** (100ms) ao passar o mouse

