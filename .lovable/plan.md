

# Otimização para iPhone (Notch e Dynamic Island)

O problema é que iPhones possuem áreas seguras (safe areas) no topo — o "notch" nos modelos mais antigos e a "Dynamic Island" nos mais recentes — e na parte inferior (home indicator). Atualmente, o conteúdo pode ficar por trás dessas áreas.

## O que será feito

### 1. CSS Global — Safe Area no topo e fundo
Adicionar padding dinâmico usando `env(safe-area-inset-top)` e `env(safe-area-inset-bottom)` nos elementos-chave:

- **PageHeader (mobile)**: Adicionar `pt-[env(safe-area-inset-top)]` para que o header sticky respeite o notch/Dynamic Island, empurrando o conteúdo para baixo da câmera.
- **MobileBottomNav**: Já tem classe `safe-area-bottom`. Verificar se o CSS correspondente existe e funciona corretamente com `pb-[env(safe-area-inset-bottom)]`.
- **DownloadBanner**: Quando exibido no topo (antes do header), adicionar `pt-[env(safe-area-inset-top)]` para não ficar atrás do notch.

### 2. HTML — viewport-fit=cover
O `index.html` já tem `viewport-fit=cover` no meta viewport e `apple-mobile-web-app-status-bar-style` como `black-translucent` — isso está correto e permite que o app use a área toda da tela enquanto respeitamos as safe areas via CSS.

### 3. CSS Utilitário
Adicionar no `index.css` uma classe utilitária `.safe-area-top` com `padding-top: env(safe-area-inset-top)` e garantir que `.safe-area-bottom` também existe para a bottom nav.

### Arquivos a editar

| Arquivo | Mudança |
|---|---|
| `src/index.css` | Adicionar classes `.safe-area-top` e verificar `.safe-area-bottom` |
| `src/components/layout/PageHeader.tsx` | Adicionar safe-area-top ao header sticky |
| `src/components/layout/MobileBottomNav.tsx` | Verificar/ajustar safe-area-bottom |
| `src/components/pwa/DownloadBanner.tsx` | Adicionar safe-area-top quando no topo da página |
| `src/components/layout/MainLayout.tsx` | Garantir que o DownloadBanner + PageHeader se integrem com as safe areas |

### Detalhes técnicos

O CSS `env(safe-area-inset-top)` retorna o tamanho exato da área ocupada pelo notch/Dynamic Island (0px em dispositivos sem notch, ~47px no notch, ~59px na Dynamic Island). Combinado com `viewport-fit=cover` (já presente), o conteúdo se expande até as bordas mas respeita as áreas seguras via padding.

