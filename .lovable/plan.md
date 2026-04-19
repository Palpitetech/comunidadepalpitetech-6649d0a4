

## Plano: Limpar dead code residual da unificação `/comunidade` → `/home`

### Diagnóstico

Após a unificação das rotas, dois arquivos ficaram **órfãos ou esvaziados**:

**1. `src/components/layout/Header.tsx` — ARQUIVO MORTO**
- Header desktop legado com links "Início / Comunidade / Resultados".
- Confirmado via busca: **zero imports** em todo o projeto (`from ".../layout/Header"` não retorna nada).
- O header em uso é `AppHeader.tsx`, montado via `MainLayout.tsx`.
- Mantê-lo gera ruído (links apontando para `/comunidade`, `/resultados` — rotas que ou foram redirecionadas ou nem existem).

**2. `src/components/comunidade/FeedHeader.tsx` — COMPONENTE VAZIO**
- Renderiza apenas uma `<div>` sem conteúdo visível (comentário interno: *"Title removed, moved to Header via MainLayout"*).
- Import `Users` do lucide-react não é usado.
- Constante `PERMITIR_POSTS_USUARIOS` está duplicada (já existe em `CriarPost.tsx` como flag oficial) e aqui só guarda um `<button className="hidden">` vazio.
- Usado apenas em `Comunidade.tsx` (linha 41): `{!isMobile && <FeedHeader />}` — renderiza nada no desktop.

### O que NÃO é dead code (verificado)

- **`CriarPost.tsx` + rota `/criar-post` + `SnapshotButton.tsx` + flag `PERMITIR_POSTS_USUARIOS`**: são código **pausado intencionalmente** conforme `mem://constraints/user-post-creation-disabled`. Mantidos para reativação futura. **NÃO mexer.**
- **Edge functions `group-blast*` e `BotPostsTab/BotAutomationTab`** usam `/comunidade/post/...` (rota de detalhes preservada). **NÃO mexer.**
- **Pasta `src/components/comunidade/`**: nome interno, outros componentes ainda em uso (`PostCard`, `PostCardSkeleton`, `LoteriaBadge`, `FormattedContent`).

### Etapa 1 — Deletar arquivo morto

**1.1**: Deletar `src/components/layout/Header.tsx` (150 linhas, zero referências).

### Etapa 2 — Remover componente vazio

**2.1**: Deletar `src/components/comunidade/FeedHeader.tsx` (componente sem conteúdo útil).
**2.2**: Em `src/pages/Comunidade.tsx`:
- Remover import `FeedHeader` (linha 5).
- Remover linha 41: `{!isMobile && <FeedHeader />}`.

### Arquivos afetados (3)

1. `src/components/layout/Header.tsx` — **DELETAR**
2. `src/components/comunidade/FeedHeader.tsx` — **DELETAR**
3. `src/pages/Comunidade.tsx` — remover 2 linhas (import + uso)

### Garantias

- **Zero impacto visual**: `FeedHeader` já renderizava nada no desktop, `Header.tsx` nunca era renderizado.
- **Zero impacto funcional**: nenhum import quebrado (verifiquei busca completa).
- **Sem afetar código pausado**: a flag `PERMITIR_POSTS_USUARIOS` permanece intacta em `CriarPost.tsx` (fonte oficial), apenas a duplicata vazia no `FeedHeader` é removida.
- **Sem alterar memória**: nenhuma regra precisa ser atualizada — esses arquivos não estão documentados em memórias.

