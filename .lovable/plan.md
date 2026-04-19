

## Diagnóstico

A diferença de altura no header não é o `<header>` em si — é causada pelos **3 banners renderizados DENTRO do `<header sticky>`** em `AppHeader.tsx` (linhas 527-529):

- `<PushNotificationBanner />` — aparece se logado e permissão de push = "default" e não dismissado.
- `<DownloadBanner />` — aparece se PWA não instalada e não dismissada.
- `<PWAUpdateBanner />` — aparece se há atualização do service worker disponível.

Como esses banners estão **dentro** do `<header className="sticky top-0">`, eles são considerados parte da altura sticky. Quando ativos, o "topo fixo" tem `48px (header) + 60-80px (banner) = 108-128px`. Quando dispensados/inativos, o topo fixo volta para `48px`. Por isso a percepção de "header maior" na imagem 02 e "menor" na imagem 01.

A decisão anterior (agrupar banners dentro do header) foi revertida pelo usuário: ele quer **a versão mais baixa e fixa sempre** — ou seja, o `<header sticky>` deve conter **apenas a barra do header** (`h-12 / h-14`), nunca os banners.

## Plano de implementação (3 etapas)

### Etapa 1 — Tirar os banners do header sticky em `AppHeader.tsx`

**Sub-etapa 1.1**: Remover linhas 527-529 (`<PushNotificationBanner />`, `<DownloadBanner />`, `<PWAUpdateBanner />`) de dentro do `<header>`.

**Sub-etapa 1.2**: Remover os 3 imports correspondentes (linhas 30-32).

Resultado: `<header sticky>` passa a ter altura **constante** (`h-12` mobile / `h-14` desktop) — nunca varia.

### Etapa 2 — Renderizar os banners no `MainLayout.tsx` (fora do sticky, dentro do `<main>` rolável)

**Sub-etapa 2.1**: Adicionar imports dos 3 banners no topo do `MainLayout.tsx`.

**Sub-etapa 2.2**: Renderizar os 3 banners **dentro do `<main>`**, antes do `{children}`. Eles passarão a fazer parte do conteúdo rolável — somem ao rolar, mas o header sticky permanece sempre na mesma altura.

```tsx
<main>
  <PushNotificationBanner />
  <DownloadBanner />
  <PWAUpdateBanner />
  {youtubeVideoId && <PageVideo ... />}
  {children}
</main>
```

### Etapa 3 — Verificar que não sobrou código morto

**Sub-etapa 3.1**: Confirmar via grep que `PushNotificationBanner`, `DownloadBanner` e `PWAUpdateBanner` só são importados no novo local (`MainLayout.tsx`) — sem duplicação em `Comunidade.tsx` ou outras páginas.

**Sub-etapa 3.2**: Confirmar que `AppHeader.tsx` não tem mais imports/refs órfãos dos 3 banners.

## Arquivos afetados (2)

1. **`src/components/layout/AppHeader.tsx`** — remover 3 banners e seus imports.
2. **`src/components/layout/MainLayout.tsx`** — importar e renderizar 3 banners no topo do `<main>`.

## Resultado visual esperado

```text
ANTES (com banner ativo)              DEPOIS (com banner ativo)
┌──────────────────────────┐ ← sticky ┌──────────────────────────┐ ← sticky
│ 🟪   Comunidade    👤    │  108px   │ 🟪   Comunidade    👤    │  56px CONSTANTE
│ 🔔 Receba notificações ✕ │ inteiro  └──────────────────────────┘
└──────────────────────────┘          │ 🔔 Receba notificações ✕ │ ← rola
                                      │ ... conteúdo da página    │

ANTES (banner dispensado)             DEPOIS (banner dispensado)
┌──────────────────────────┐ ← sticky ┌──────────────────────────┐ ← sticky
│ 🟪   Comunidade    👤    │  56px    │ 🟪   Comunidade    👤    │  56px CONSTANTE
└──────────────────────────┘          └──────────────────────────┘
   altura "encolhe"                      altura sempre igual
```

## Garantias

- **Header sticky com altura fixa permanente** (`h-12` mobile / `h-14` desktop), sem variar nunca.
- **Banners continuam funcionando** — apenas mudam de "fixo no topo" para "rolam com o conteúdo".
- **Centralização do título preservada** (já estava correta com grid `[48px_1fr_48px]`).
- **Nenhum código morto** após a refatoração.
- **Nenhuma alteração** em outros componentes, hooks, edge functions ou páginas.

