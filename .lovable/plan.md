
## Diagnóstico

O **header em si tem altura fixa** (`h-12` mobile / `h-14` desktop = 48px / 56px). Não muda de tamanho.

O que muda visualmente é o que aparece **logo abaixo** do header sticky:

1. **`PushNotificationBanner`** (em `MainLayout.tsx`, linha 60) — renderizado abaixo do `AppHeader` em **TODAS as páginas**. Banner verde com 64px de altura aprox. (`py-3` + ícone 40px + texto). Some na sessão se usuário dismissar.

2. **`DownloadBanner` + `PWAUpdateBanner`** (em `Comunidade.tsx`, linhas 42-43) — renderizados como **primeiros filhos** da página `/home`. Aparecem colados no header com aprox. 60-80px adicionais.

3. **Como esses banners NÃO são sticky**, eles ficam visíveis quando o scroll está em `0` (topo) e somem assim que o usuário rola, deixando apenas o `AppHeader` sticky no topo. Isso cria a percepção de "header maior sem scroll → menor com scroll".

4. Adicionalmente, no mobile com `safe-area-inset-top`, o iPhone adiciona padding extra que não conta como altura "do header" mas faz parte do espaço visual.

## Soluções (sem mudar nada ainda)

### Opção A — Recomendada: agrupar banners DENTRO do header sticky

Mover `PushNotificationBanner`, `DownloadBanner` e `PWAUpdateBanner` para dentro do `<header sticky>` do `AppHeader.tsx`. Assim eles fazem parte do "topo" e se mantêm fixos junto com o header — não há mais "encolhimento" visual ao rolar.

- **Prós**: header e banners formam um bloco único, sempre visível, percepção de altura constante.
- **Contras**: ocupa mais tela útil quando banners estão ativos. Mas eles são dispensáveis (botão X), então é aceitável.

### Opção B — Banners FORA do header e SEMPRE escondidos no scroll

Manter como está, mas adicionar lógica para esconder banners ao rolar (`scrollY > 50`). Mantém a sensação de "topo limpo" mas não resolve o problema de centralização inicial.

### Opção C — Reorganizar página: banners ABAIXO do conteúdo principal

Mover `DownloadBanner` e `PWAUpdateBanner` para o **fim** da página (rodapé do feed), e o `PushNotificationBanner` virar um toast/sheet inferior em vez de banner superior. Header fica sempre sozinho no topo.

## Recomendação

**Opção A** — agrupar tudo dentro do `<header>` sticky. Simples, resolve 100% o problema visual relatado e mantém a hierarquia de informação (avisos importantes ficam sempre visíveis no topo).

## Arquivos a editar (3)

1. **`src/components/layout/AppHeader.tsx`**
   - Aceitar children opcional ou renderizar os 3 banners internamente.
   - Banners ficam DENTRO da tag `<header sticky>`, abaixo do grid principal.

2. **`src/components/layout/MainLayout.tsx`**
   - Remover `<PushNotificationBanner />` daqui (passa para dentro do header).

3. **`src/pages/Comunidade.tsx`**
   - Remover `<DownloadBanner />` e `<PWAUpdateBanner />` do início do conteúdo (passam para dentro do header globalmente, aparecendo só quando aplicável).

## Resultado esperado

```text
ANTES (sem scroll)              DEPOIS (sem scroll)
┌──────────────────────────┐    ┌──────────────────────────┐
│   ←   Comunidade    👤   │    │   ←   Comunidade    👤   │ ← sticky
├──────────────────────────┤    │ 🔔 Receba notificações   │ ← sticky
│ 📥 Instale o app    ✕    │    │ 📥 Instale o app    ✕    │ ← sticky
│ 🔔 Receba notif.    ✕    │    ├──────────────────────────┤
│  ↓ scrolla, somem ↓      │    │  conteúdo da página      │
│  conteúdo da página      │    │  ...                     │
                                
ANTES (com scroll)              DEPOIS (com scroll)
┌──────────────────────────┐    ┌──────────────────────────┐
│   ←   Comunidade    👤   │    │   ←   Comunidade    👤   │ ← sticky
└──────────────────────────┘    │ 🔔 Receba notificações   │ ← sticky
   "header parece menor"        │ 📥 Instale o app    ✕    │ ← sticky
                                └──────────────────────────┘
                                   altura sempre igual
```

Centralização do título do header (`Comunidade`) já está correta no grid `[64px_1fr_64px]` — não precisa mexer.
