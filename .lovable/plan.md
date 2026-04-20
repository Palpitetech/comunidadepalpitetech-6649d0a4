

# Refatoração 100% do Sidebar Admin — nova arquitetura visual e UX

## Objetivo
Reconstruir o sidebar de `/admin` com identidade visual profissional, navegação mais clara, busca rápida, agrupamento melhor balanceado e UX superior em ambos estados (expandido e colapsado).

---

## Visão geral

```text
EXPANDIDO (16rem)                   COLAPSADO (4rem)
┌─────────────────────────┐         ┌──────┐
│ ⚡ Painel Admin         │         │  ⚡  │  ← logo + trigger
│ ──────────────────────  │         │      │
│ 🔍 Buscar... (Ctrl+K)   │         │  🔍  │  ← abre command palette
│ ──────────────────────  │         │ ──── │
│ PRINCIPAL               │         │  ⌂   │  ← Painel
│  ⌂ Painel               │         │  📄  │  ← Planos
│  📄 Planos              │         │  👥  │  ← Usuários
│  👥 Usuários       [12] │         │  🤖  │
│  🤖 Bots                │         │  🎁  │
│                         │         │ ──── │
│ COMUNICAÇÃO             │         │  💬  │  ← WhatsApp (flyout)
│  💬 WhatsApp     ▸      │         │  🎁  │
│  🎁 Convites            │         │ ──── │
│  📊 Eventos             │         │  💲  │  ← Financeiro (flyout)
│                         │         │  🎫  │  ← Bolões (flyout)
│ FINANCEIRO        ▾     │         │  🎥  │  ← Gravação (flyout)
│  💲 Custos IA           │         │ ──── │
│  🐷 Assinaturas Op.     │         │  ⚙   │  ← Sistema
│  📱 Chip Celulares      │         │      │
│  🧾 Custos Op.          │         │  👤  │  ← perfil admin
│  🛒 Vendas              │         └──────┘
│                         │
│ BOLÕES            ▾     │
│  ➕ Novo Bolão          │
│  📋 Listagem            │
│  💳 Pagamentos     [3]  │  ← badge pendentes
│  🏆 Premiação           │
│  💰 Carteira            │
│  🏆 Resgates       [5]  │
│  💰 Compras Saldo       │
│  💳 Compras Cotas       │
│                         │
│ GRAVAÇÃO          ▾     │
│  📊 Lotofácil           │
│  📊 Quina               │
│                         │
│ SISTEMA                 │
│  📈 Métricas            │
│  🔌 Integrações         │
│ ──────────────────────  │
│ 👤 Bruno (admin)        │
│  ↩ Voltar ao app        │
└─────────────────────────┘
```

---

## Mudanças principais

### 1. Cabeçalho com identidade
- **Header fixo no topo** com logo "⚡ Painel Admin" (text-sm font-bold + chip vermelho `Admin`)
- Quando colapsado: só o ícone do raio centralizado
- Substitui o `SidebarGroupLabel "Admin"` atual (que sumia ao colapsar)

### 2. Busca rápida (Command Palette)
- Input com placeholder "Buscar página... (Ctrl+K)" abaixo do header
- Atalho `Ctrl/Cmd + K` abre `CommandDialog` (shadcn) com **todas as 24+ páginas** indexadas (label, ícone, grupo, url)
- Quando colapsado: só o ícone 🔍 → abre o mesmo dialog
- Reduz drasticamente a fricção para chegar em páginas profundas

### 3. Reagrupamento dos itens (4 → 5 grupos mais coerentes)

**Antes:** Principal (9 itens, denso), Financeiro, Bolões, Gravação
**Depois:**

| Grupo | Itens |
|---|---|
| **Principal** (sem label) | Painel, Planos, Usuários, Bots |
| **Comunicação** | WhatsApp, Convites, Eventos |
| **Financeiro** | Custos IA, Assinaturas Op., Chip Celulares, Custos Op., Vendas |
| **Bolões** | Novo Bolão, Listagem, Pagamentos, Premiação, Carteira, Resgates, Compras Saldo, Compras Cotas |
| **Gravação** | Lotofácil, Quina |
| **Sistema** | Métricas, Integrações |

Distribui melhor a carga cognitiva (4 itens "Principal" + grupos balanceados) em vez dos 9 itens soltos atuais.

### 4. Badges de notificação dinâmicos
Itens que precisam de atenção mostram contador discreto à direita:
- **Usuários**: novos cadastros últimas 24h (query `perfis` count)
- **Pagamentos**: bolões com status `pendente_aprovacao`
- **Resgates**: solicitações `status='pendente'`

Hook novo: `useAdminBadges()` — uma query agregada com `useQuery` (refetch a cada 60s), retorna `{ usuarios, pagamentos, resgates }`. Badge renderiza como `<span className="ml-auto text-[10px] bg-destructive/15 text-destructive rounded-full px-1.5">N</span>` (ou `bg-amber-500/15` para info).

### 5. Footer com identidade do admin + atalho voltar
- Mini card: avatar do admin + nome + role chip "admin"
- Botão "↩ Voltar ao App" (link para `/`) — facilita troca de contexto
- Quando colapsado: só o avatar (clicável → mesmo menu)

### 6. Estado colapsado refinado
- Manter a largura `3.5rem` atual (já corrigida)
- Submenus continuam via Popover lateral (já funciona)
- **Adicionar:** label de grupo aparece como header dentro do popover (já existe)
- **Adicionar:** botão de expansão "→" na borda inferior do sidebar (afora do `SidebarTrigger` no header) para expandir sem precisar ir ao topo

### 7. Estilização visual
- Background `bg-card` mantido + sutil `bg-gradient-to-b from-card via-card to-card/95`
- Item ativo: barra vertical 3px à esquerda em `bg-primary` + `bg-sidebar-accent`
- Hover: `bg-sidebar-accent/60` + leve `translate-x-0.5` (microinteração)
- Group label: `text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70`
- Ícones leaves: `h-4 w-4` expandido / `h-5 w-5` colapsado (já corrigido)
- Separadores entre grupos no estado colapsado: `h-px` mais sutil (já existe, manter)

### 8. Persistência e atalhos
- Estado expandido/colapsado já persiste em cookie (já funciona)
- Atalho `Ctrl/Cmd + B` toggle sidebar (já existe)
- Novo: `Ctrl/Cmd + K` abre busca

---

## Arquitetura — refator do `AdminSidebar.tsx`

Quebrar em sub-componentes locais (no mesmo arquivo, organização):

```tsx
// AdminSidebar.tsx
- AdminSidebarHeader          // logo + chip Admin
- AdminSidebarSearch          // input + Ctrl+K trigger
- AdminSidebarSection         // wrapper de grupo (label + items)
- AdminNavItem                // leaf com badge opcional
- AdminNavGroup               // grupo com submenus (collapsible / popover)
- AdminSidebarFooter          // perfil admin + voltar app
- AdminSidebarCommandPalette  // CommandDialog com todas as páginas
```

E um hook novo:

```tsx
// src/hooks/useAdminBadges.ts
export function useAdminBadges() {
  return useQuery({
    queryKey: ['admin-sidebar-badges'],
    queryFn: async () => {
      const [usuariosNovos, pagPendentes, resgPendentes] = await Promise.all([
        supabase.from('perfis').select('id', { count: 'exact', head: true })
          .gte('created_at', dayjs().subtract(1, 'day').toISOString()),
        supabase.from('bolao_pagamentos').select('id', { count: 'exact', head: true })
          .eq('status', 'pendente_aprovacao'),
        supabase.from('bolao_resgates').select('id', { count: 'exact', head: true })
          .eq('status', 'pendente'),
      ]);
      return {
        usuarios: usuariosNovos.count ?? 0,
        pagamentos: pagPendentes.count ?? 0,
        resgates: resgPendentes.count ?? 0,
      };
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
```

> Tabelas exatas (`bolao_pagamentos`, `bolao_resgates`) serão validadas no momento da implementação contra o schema; se nomes/colunas diferirem, ajusto sem mudar a UX.

---

## Detalhes técnicos sensíveis

- **Reuso do componente shadcn `sidebar.tsx`**: NÃO mexo nele. Toda customização visual fica em `AdminSidebar.tsx` via classes/composição.
- **CommandDialog**: já existe `@/components/ui/command`. Vou reutilizar.
- **Dependência `dayjs`**: já está no projeto (verificar via search). Se não, uso `date-fns` que já é dependência.
- **Mobile**: o sidebar shadcn já vira `Sheet` em mobile automaticamente — herda toda a nova UI sem trabalho extra.
- **Acessibilidade**: cada `Link` mantém label visível (expandido) ou tooltip (colapsado). `aria-current="page"` no item ativo.
- **Performance**: `useAdminBadges` agrupa 3 contagens em `Promise.all`, refetch a cada 60s, usa `head: true` (sem trafegar dados).

---

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/components/layout/AdminSidebar.tsx` | **Reescrever 100%** — nova arquitetura com header, busca, 6 grupos, badges, footer |
| `src/components/admin/AdminCommandPalette.tsx` | **Novo** — CommandDialog com todas as páginas indexadas |
| `src/hooks/useAdminBadges.ts` | **Novo** — fetch agregado de contadores pendentes |
| `src/components/layout/AdminLayout.tsx` | **Editar levemente** — pode remover `SidebarTrigger` redundante já que o sidebar terá seu próprio botão de expand interno (ou manter ambos para conveniência) |

## Fora de escopo
- Mexer no `src/components/ui/sidebar.tsx` (shadcn primitivo — fica intocado)
- Mudar o sidebar do app público
- Adicionar novas páginas/rotas admin
- Migration de banco

## Resultado esperado
- Sidebar admin com **identidade visual própria** (header com chip Admin, footer com perfil)
- **Busca instantânea** (Ctrl+K) para chegar em qualquer página em <2s
- **6 grupos balanceados** em vez de 9 itens soltos no topo
- **Badges em tempo quase real** mostrando o que precisa atenção (usuários novos, pagamentos pendentes, resgates)
- Estado colapsado **profissional** (icones centrados, popover de submenus, expand button extra)
- **Atalhos de teclado** (Ctrl+B toggle, Ctrl+K busca)
- Zero impacto no app público ou no componente shadcn base

