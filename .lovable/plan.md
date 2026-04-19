

## Diagnóstico do Header atual

O sistema tem um **único header** (`DesktopHeader.tsx`) usado para mobile e desktop via `MainLayout`. O `PageHeader.tsx` existe mas **não está mais em uso** (foi desativado, comentado em `MainLayout` linha 64). Isso é parte do problema visual: ficou código duplicado/abandonado e o `DesktopHeader` está fazendo trabalho demais.

### Problemas identificados (mobile 390x844)

1. **Altura excessiva no mobile**: o container usa `py-0.5` (ok) mas o avatar/botões usam `h-8` (32px) e o título `text-base md:text-lg font-bold` em uma linha + logo + back button + 2 ícones — tudo competindo no mesmo eixo. Resultado: header parece "alto e apertado".

2. **Desequilíbrio de layout**: a `<div>` interna alterna entre `flex` (na home) e `grid grid-cols-[auto_1fr_auto]` (outras páginas). No mobile, em páginas com `pageTitle`, o título fica na coluna esquerda junto da logo (que some), enquanto avatar+save ficam à direita — **nada centralizado**, tudo encostado nas bordas.

3. **Logo + Back button conflito**: quando há `pageTitle` no mobile, a logo é escondida e o back button aparece. Mas o `Link to="/"` mantém `mr-2` e `gap-2`, causando espaços vazios fantasmas.

4. **Título sem hierarquia clara**: `text-base md:text-lg` — no mobile fica 16px sem destaque, competindo visualmente com os ícones de ação ao lado (avatar 32px). O título deveria ser o elemento dominante.

5. **Safe-area duplicado**: `paddingTop: max(0px, env(safe-area-inset-top, 0px))` no header + `py-0.5` no container interno — em iPhones com notch isso empilha padding e aumenta percepção de altura.

6. **PageHeader.tsx órfão**: arquivo existe mas não é usado em lugar nenhum no `MainLayout`. Confirma código morto contribuindo para confusão.

7. **Home (`/`)** vs **outras páginas**: na home, o header só mostra logo + "Entrar"/avatar (sem nav, sem título). Mas usa o **mesmo** componente pesado, com `grid` desligado e `flex` ligado — cria inconsistência sutil de altura entre rotas.

8. **No desktop**: o `<nav>` central usa `flex-wrap` com 8+ botões + 4 dropdowns. Em telas médias (md ~768-1024px) os botões quebram em 2 linhas, **dobrando a altura do header**.

## Plano de melhorias (sem implementar agora)

### A. Estrutura unificada (mobile + desktop)

Adotar grid de 3 colunas **fixo em todas as páginas** (incluindo home), com alturas padronizadas:

```text
[ ESQUERDA 64px ] [ CENTRO flex-1 ] [ DIREITA 64px ]
   logo OU back        título            avatar/entrar
```

- Altura única do header: **48px no mobile** (`h-12`), **56px no desktop** (`h-14`).
- `py` removido; usar `h-12 md:h-14` no container interno.
- Safe-area aplicada **só** no `<header>` externo, nunca no interno.

### B. Mobile (390px) — header limpo

- **Esquerda (40x40)**: logo OU back button (nunca ambos, nunca os dois com espaço reservado).
- **Centro**: 
  - Home `/`: logo + "Palpite Tech" (centralizado).
  - Outras: `pageTitle` em `text-base font-semibold` truncado, **centralizado**.
- **Direita**: 
  - Deslogado: botão "Entrar" `h-9 px-3 text-sm`.
  - Logado: apenas avatar `h-9 w-9`. **Remover** o ícone "Save" do header mobile (ele já está no `MobileBottomNav` via "Jogos Salvos").
- Resultado: 3 elementos balanceados, título dominante, altura ~48px.

### C. Desktop (≥768px) — evitar quebra de linha

Problema principal: 8 itens + 4 dropdowns no `<nav>` central. Soluções:

- Em `md` (768-1023px): manter só logo + **um único dropdown "Loterias"** (que abre submenu com Lotofácil/Mega/Quina/Dupla/Lotomania/Dia de Sorte) + Concursos + Gerar Jogos.
- Em `lg+` (≥1024px): expandir para os 4 dropdowns separados como hoje.
- Garantir `flex-nowrap` + `overflow-hidden` na nav para nunca quebrar linha (forçar altura única).

### D. Limpeza de código

- **Remover `src/components/layout/PageHeader.tsx`** (não usado, confunde).
- Remover comentário órfão `{/* Mobile PageHeader logic moved to DesktopHeader */}` em `MainLayout.tsx`.
- Renomear `DesktopHeader` → `AppHeader` (já que serve mobile + desktop). Atualizar imports em `MainLayout.tsx`.

### E. Centralização real do título

Usar `grid grid-cols-[64px_1fr_64px]` com `<h1>` no centro com `text-center` + `truncate` + `mx-auto`. Isso garante que o título fique **opticamente centralizado** independentemente do conteúdo lateral (botão back tem mesma largura reservada que o avatar).

## Arquivos afetados

1. `src/components/layout/DesktopHeader.tsx` — refatorar para grid 3 colunas, altura fixa, remover Save mobile, dropdown único em md.
2. `src/components/layout/MainLayout.tsx` — limpar comentário órfão, atualizar import se renomear.
3. `src/components/layout/PageHeader.tsx` — **deletar** (código morto).

## Resumo visual esperado

```text
MOBILE (atual)                    MOBILE (proposto)
┌──────────────────────────┐     ┌──────────────────────────┐
│ ←  📊 Resultados   💾 👤 │     │  ←      Resultados    👤 │  ← 48px
└──────────────────────────┘     └──────────────────────────┘
   título à esquerda,                título centralizado,
   3 ações à direita,                1 ação à direita,
   altura ~56px desigual             altura fixa 48px

DESKTOP md (atual)                DESKTOP md (proposto)
┌─────────────────────────────┐  ┌─────────────────────────────┐
│ Logo  Bolões Gerar Conc...  │  │ Logo   Loterias▾ Conc Gerar │  ← 56px
│       Lotofácil Mega Dupla..│  │                          👤 │
│                          👤 │  └─────────────────────────────┘
└─────────────────────────────┘     1 linha, sem wrap
   nav quebra em 2 linhas,
   altura ~96px
```

