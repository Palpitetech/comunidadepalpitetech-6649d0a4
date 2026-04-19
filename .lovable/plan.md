

## Plano: Unificar `/comunidade` → `/home` com título "Estudos"

### Diagnóstico

**Hoje** existem duas rotas idênticas renderizando o mesmo componente `Comunidade`:
```tsx
// src/App.tsx (linhas 163-164)
<Route path="/home" element={<ProtectedRoute><Comunidade /></ProtectedRoute>} />
<Route path="/comunidade" element={<ProtectedRoute><Comunidade /></ProtectedRoute>} />
```

E `/comunidade/post/:slug` continua existindo (rota dos detalhes do post — **deve ser preservada**, é diferente).

**Decisão**: manter apenas `/home`, página passa a se chamar **"Estudos"**, e `/comunidade` (apenas a raiz, NÃO os filhos) redireciona para `/home`.

### Etapa 1 — Roteamento (`src/App.tsx`)

**1.1**: Remover a rota duplicada `/comunidade` (linha 164).
**1.2**: Adicionar redirect 301-equivalente client-side: `<Route path="/comunidade" element={<Navigate to="/home" replace />} />`.
**1.3**: Manter intacta a rota `/comunidade/post/:slug` (linha 187) — é a página de detalhes do post, não duplica nada.

### Etapa 2 — Renomear página para "Estudos" (`src/pages/Comunidade.tsx`)

**2.1**: Trocar `pageTitle="Comunidade"` por `pageTitle="Estudos"` no `<MainLayout>`.
**2.2**: Manter o nome do arquivo `Comunidade.tsx` e do componente `Comunidade()` — renomear arquivo geraria churn desnecessário em imports e o usuário pediu "não mude mais nada além do que foi pontuado".

### Etapa 3 — Bottom Nav aponta para `/home` (`src/components/layout/MobileBottomNav.tsx`)

**3.1**: Linha 19: trocar `to="/comunidade"` por `to="/home"`.
**3.2**: Linha 22: trocar `isActive("/comunidade") || isActive("/")` por `isActive("/home") || isActive("/")`.
**3.3**: Label "Estudos" já está correto (linha 28) — sem mudança.

### Etapa 4 — Atualizar referências internas que navegam para `/comunidade` raiz (apontar para `/home`)

Apenas as que vão para a **raiz** `/comunidade` (não tocar em `/comunidade/post/...`):

**4.1 — `src/components/layout/AppHeader.tsx`** (linha 135): fallback do back button → `return "/home";`
**4.2 — `src/components/auth/ProtectedRoute.tsx`** (linha 26): `isHome = pathname === "/home"` (remover comparação com `/comunidade`).
**4.3 — `src/components/shared/UpgradeModal.tsx`** (linha 121): `navigate("/home")`.
**4.4 — `src/pages/PostDetalhes.tsx`** (linhas 156, 188): voltar para `/home` em vez de `/comunidade`.
**4.5 — `src/pages/CriarPost.tsx`** (linhas 17, 138): redirects para `/home`.
**4.6 — `src/pages/ProximosConcursos.tsx`** (linha 141): `hub: "/home"`.

### Etapa 5 — Header desktop (`src/components/layout/Header.tsx`)

**5.1**: Linhas 55, 134: links "Comunidade" passam a apontar para `/home` com label "Estudos" (mantendo o ícone `Users`). 
*Observação*: este `Header.tsx` parece ser legado (o atual em uso é `AppHeader.tsx`). Confirmo o uso antes de mexer — se não estiver montado em lugar nenhum, vira candidato a remoção em outra rodada (não nesta).

### Fora de escopo (NÃO alterar)

- **`/comunidade/post/:slug`** — rota de detalhes, permanece.
- **Nome do arquivo/componente** `Comunidade.tsx` — apenas o título visual muda.
- **Edge functions** (`og-post`, `send-push`, `group-blast*`) — continuam usando `/comunidade/post/...` (URL pública dos posts). Sem mudanças.
- **Pasta `src/components/comunidade/`** — nome interno, não afeta UX.
- **`AdminMetricas.tsx`** — usa `comunidadepalpitetech.lovable.app` como base do domínio, não a rota.
- **`featureMap.ts`** — não tem entrada `/comunidade` raiz.

### Arquivos afetados (8)

1. `src/App.tsx`
2. `src/pages/Comunidade.tsx`
3. `src/components/layout/MobileBottomNav.tsx`
4. `src/components/layout/AppHeader.tsx`
5. `src/components/auth/ProtectedRoute.tsx`
6. `src/components/shared/UpgradeModal.tsx`
7. `src/pages/PostDetalhes.tsx`
8. `src/pages/CriarPost.tsx`
9. `src/pages/ProximosConcursos.tsx`
10. `src/components/layout/Header.tsx` (se confirmado em uso)

### Garantias

- Quem acessar `/comunidade` é redirecionado para `/home` (sem 404, sem perda de SEO interno).
- `/comunidade/post/:slug` continua funcionando — links externos do WhatsApp/push/email não quebram.
- Bottom nav "Estudos" leva para `/home`.
- Título visível no header passa a ser "Estudos".
- Nenhuma alteração funcional além do roteamento e título.

