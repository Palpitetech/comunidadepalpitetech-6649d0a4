

## Diagnóstico final (causa raiz)

O **header tem altura fixa** (`h-12` = 48px mobile / `h-14` = 56px desktop). A inconsistência visual **não é altura real**, é **percepção visual** causada por 4 problemas no `AppHeader.tsx`:

### Problema 1 — Branding duplicado na home (`/`) e em qualquer página sem `pageTitle`
Linhas 339-344 (esquerda) renderizam `<img logo>` + texto "Palpite Tech" oculto no mobile.
Linhas 364-368 (centro) renderizam **outro** texto "Palpite Tech" no mobile.
Resultado: 2 elementos de branding competindo, header parece pesado e "alto", título não fica visualmente centralizado.

### Problema 2 — Logo duplicada quando há back + pageTitle
Linhas 347-354: quando `showMobileBack=true`, ainda tenta renderizar a logo de novo no desktop. No mobile, o `md:hidden` esconde, mas o `<Link>` permanece no DOM (consome layout em alguns browsers e aumenta complexidade do grid).

### Problema 3 — Safe-area duplicada no mobile
Linha 321: `paddingTop: max(0px, env(safe-area-inset-top, 0px))` aplicado no `<header>`. Isso é correto, MAS o grid interno usa `h-12` (altura fixa) **sem considerar** que em iPhones o safe-area adiciona ~44px ao topo. O header no iPhone fica `44px (safe-area) + 48px (h-12) = 92px` total, enquanto no Android fica só 48px. A percepção de "header alto" é real em iPhones.

### Problema 4 — Código morto no header
- Linha 548: `export { AppHeader as DesktopHeader }` — nenhum arquivo importa `DesktopHeader` (verificado via grep).
- Linha 130: prop `breadcrumb` declarada mas nunca usada dentro do componente.
- Linha 26 (MainLayout): prop `headerRightContent` declarada mas nunca usada.
- Linha 22 (MainLayout): comentário órfão sobre `PageHeader` (já deletado).

## Plano de implementação (4 etapas)

### Etapa 1 — Eliminar branding duplicado no header (resolve problema 1 e 2)

**Sub-etapa 1.1**: Refatorar a coluna ESQUERDA do grid em `AppHeader.tsx` para renderizar **apenas UMA coisa** por vez:
- Se `showMobileBack=true` → mostra **só** o botão Voltar (mobile) ou logo+texto (desktop).
- Senão → mostra **só** a logo (sem texto), sempre.

**Sub-etapa 1.2**: Refatorar a coluna CENTRO para sempre conter **apenas o título da página**:
- Home (`/`) → "Palpite Tech" (texto único, centralizado).
- Outras páginas com `pageTitle` → o `pageTitle` (centralizado).
- Páginas sem `pageTitle` e fora da home → vazio (apenas para desktop usar nav).

**Sub-etapa 1.3**: Remover o bloco duplicado de logo das linhas 347-354 (logo extra no desktop quando há back).

### Etapa 2 — Padronizar percepção de altura no iPhone (resolve problema 3)

**Sub-etapa 2.1**: Manter `paddingTop: env(safe-area-inset-top)` no `<header>` (correto).

**Sub-etapa 2.2**: Adicionar `min-height: 48px` no grid interno mobile (`h-12 min-h-12`) para garantir que mesmo com o safe-area visualmente o conteúdo do header tenha exatamente a mesma altura útil em iPhone e Android — a área "do título" sempre será 48px abaixo do safe-area.

**Sub-etapa 2.3**: Garantir que o `<h1>` central use `flex items-center justify-center` com `leading-none` para centralizar verticalmente perfeitamente dentro dos 48px (evita o "informações de baixo para cima" relatado).

### Etapa 3 — Centralização ótica perfeita do título

**Sub-etapa 3.1**: Trocar o grid mobile de `[64px_1fr_64px]` para `[48px_1fr_48px]` — alinha com a altura do header (48x48 quadrado nas laterais), garante simetria visual.

**Sub-etapa 3.2**: Forçar a coluna central com `flex items-center justify-center text-center` e o `<h1>` com `mx-auto` + `max-w-full truncate`.

**Sub-etapa 3.3**: Padronizar tamanho da logo para `h-7 w-7` (28px) no mobile — mais proporcional dentro do header de 48px (atual `h-8` = 32px ocupa 67% da altura, fica apertado).

### Etapa 4 — Limpeza de código morto

**Sub-etapa 4.1** — Em `src/components/layout/AppHeader.tsx`:
- Remover linha 547-548: `export { AppHeader as DesktopHeader }`.
- Remover prop `breadcrumb` da interface (linha 130) e do parâmetro do componente.

**Sub-etapa 4.2** — Em `src/components/layout/MainLayout.tsx`:
- Remover prop `breadcrumb` da interface (linha 22) e do desestruturação.
- Remover prop `headerRightContent` da interface (linha 26) e da desestruturação.
- Remover comentário órfão sobre `PageHeader` (linha 19).
- Remover passagem de `breadcrumb` para `<AppHeader>` (linha 58).

**Sub-etapa 4.3**: Verificar que nenhum `import { DesktopHeader }` quebra após remoção (grep confirmou: zero usos).

## Arquivos afetados (2)

1. `src/components/layout/AppHeader.tsx` — refatorar grid, eliminar duplicação de branding/logo, ajustar tamanhos, remover export legado e prop não usada.
2. `src/components/layout/MainLayout.tsx` — remover props não usadas e comentário órfão.

## Resultado visual esperado

```text
ANTES (sem scroll, route /)        DEPOIS (sem scroll, route /)
┌──────────────────────────┐       ┌──────────────────────────┐
│ 🟪    Palpite Tech  Entr │       │ 🟪   Palpite Tech   Entr │  ← 48px
│      (alto, duplicado)   │       │   (limpo, centralizado)  │
└──────────────────────────┘       └──────────────────────────┘

ANTES (route /home)                DEPOIS (route /home)
┌──────────────────────────┐       ┌──────────────────────────┐
│ 🟪     Comunidade    👤  │       │ 🟪    Comunidade    👤   │  ← 48px
└──────────────────────────┘       └──────────────────────────┘
                                      altura idêntica em todas as rotas
                                      título sempre centralizado
                                      sem branding duplicado
```

## Garantias

- **Nenhum código morto restante** após etapa 4.
- **Nenhuma alteração** em outros componentes, páginas, hooks ou edge functions.
- **Banners (Push/Download/PWAUpdate) permanecem intocados** dentro do header sticky (já corretos).
- **Centralização do título** garantida pelo grid simétrico `[48px_1fr_48px]`.
- **Altura idêntica** em todas as rotas (home, comunidade, internas) e plataformas (iPhone, Android, desktop).

