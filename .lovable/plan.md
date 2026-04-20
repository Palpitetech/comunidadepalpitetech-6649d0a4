

# Refatorar UI/UX de "Meus Dados" — Mobile First

## Objetivo
Transformar `/perfil/dados` numa tela mobile otimizada, com hierarquia visual clara, foto de perfil acessível, ações rápidas e melhor uso do espaço vertical (alvo: viewport 390x844).

---

## Como o usuário vai ver

```text
┌─────────────────────────────────────────┐
│ ←        Meus Dados                     │ ← header (atual)
├─────────────────────────────────────────┤
│                                         │
│           ╔═════════╗                   │
│           ║  AVATAR ║ 📷                │  ← Foto editável (toque para trocar)
│           ╚═════════╝                   │
│         Bruno Silveira                  │  ← Nome grande
│      Membro desde Mar 2025              │  ← Sub-info sutil
│                                         │
├─────────────────────────────────────────┤
│ DADOS DE CONTATO                        │  ← Section label
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 👤  Nome completo                   │ │
│ │     Bruno Silveira              ✏️  │ │  ← Tap = editar nome (inline)
│ ├─────────────────────────────────────┤ │
│ │ ✉️  E-mail                  ✓ verif.│ │
│ │     bruno@exemplo.com           📋  │ │  ← Tap longo = copiar
│ ├─────────────────────────────────────┤ │
│ │ 📱  Celular / WhatsApp     ⚠ não verif│
│ │     (51) 98185-4281         Alterar→│ │  ← Botão inline
│ └─────────────────────────────────────┘ │
│                                         │
│ IDENTIFICAÇÃO                           │
│ ┌─────────────────────────────────────┐ │
│ │ #️⃣  ID da Conta                     │ │
│ │     a1b2c3...e7b   (toque p/ copiar)│ │  ← Truncado, tap = copiar+toast
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

---

## Mudanças concretas

### 1. Cabeçalho do perfil (novo bloco compacto)
- **Avatar central 80x80** com botão câmera flutuante (já existe no `PerfilHero` — extrair só essa parte)
- **Nome grande** + **"Membro desde {mês ano}"** (a partir de `user.created_at`)
- Remove os badges de plano (já existem nas outras abas/perfil)

### 2. Lista de dados (rework completo do `MeusDadosTab`)
- Substitui `CopyableRow` por novo `DataRow` com:
  - **Ícone esquerdo** (h-10 w-10, fundo colorido por categoria)
  - **Label pequeno + valor grande** (legibilidade sênior)
  - **Indicador de verificação** inline (✓ verde / ⚠ âmbar)
  - **Ação à direita**: `Alterar →` (celular) ou ícone copy
  - **Toda a linha é tocável** (tap area ≥ 56px)
  - **Long-press copia** (UX nativa mobile)
- Agrupado em **2 seções**: "Dados de Contato" e "Identificação"
- Cards `rounded-2xl` (mais moderno mobile), `divide-y` interno

### 3. Edição inline do Nome (novo)
- Toque no nome → abre `Drawer` (bottom sheet, padrão mobile) com input + botão Salvar
- Atualiza via `updateProfile({ nome })` do `AuthContext`
- Novo componente: `EditarNomeDrawer.tsx`

### 4. Alterar Celular — converter Dialog em Drawer mobile
- No mobile, `AlterarCelularDialog` abre como **Drawer (bottom sheet)** ao invés de Dialog centralizado
- Detecta via `useIsMobile()`, fallback Dialog em desktop
- Steps `input → verify → success` ficam mais confortáveis em sheet (mais altura)
- Mantém OTP slots grandes (h-12 w-12)

### 5. Feedback de cópia melhorado
- Toast inferior (sonner) já existe, mantém
- Adiciona haptic feedback se disponível: `navigator.vibrate?.(20)`
- Animação no ícone (check verde por 1.5s)

### 6. Status de verificação clicável
- Email não verificado → tap mostra info "Verificado no cadastro"
- Celular não verificado → tap abre o drawer de alteração direto

### 7. Espaçamento e tipografia mobile
- Padding lateral `px-4` (atual ok)
- Section labels `text-[11px] uppercase tracking-wider text-muted-foreground px-1`
- Gap entre seções `mt-6`
- Valores `text-base font-semibold` (era `text-sm` — ganho de leitura)
- Labels `text-xs text-muted-foreground` (era `text-[11px]`)
- Min-height linha `min-h-[64px]` (touch target conforme guideline sênior 44px+)

### 8. Remover redundâncias
- Botão "Alterar Celular" full-width no rodapé → **removido** (ação migra para inline na linha do celular)
- Resultado: tela mais limpa, ações contextuais

---

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/components/perfil/MeusDadosTab.tsx` | **Reescrever** — novo layout em seções, `DataRow` interno, sem botão duplicado |
| `src/components/perfil/PerfilDadosHero.tsx` | **Novo** — avatar + nome + "membro desde" (extrai do `PerfilHero` mas mais enxuto) |
| `src/components/perfil/EditarNomeDrawer.tsx` | **Novo** — drawer de edição de nome |
| `src/components/perfil/AlterarCelularDialog.tsx` | **Editar** — wrapper que escolhe Dialog ou Drawer via `useIsMobile()` |
| `src/pages/PerfilDados.tsx` | **Editar** — adicionar `<PerfilDadosHero />` antes do `<MeusDadosTab />` |

> `src/components/perfil/MeusDadosTab.tsx` continua sendo usado também em `Perfil.tsx` (aba Dados) — o novo layout funciona nas duas rotas.

---

## Detalhes técnicos sensíveis

**DataRow component (interno em `MeusDadosTab`):**
```tsx
interface DataRowProps {
  icon: LucideIcon;
  iconColor?: string;          // bg-color do círculo
  label: string;
  value: string | null;
  verified?: boolean;          // mostra ✓ ou ⚠
  action?: ReactNode;          // botão "Alterar" custom
  onTap?: () => void;          // tap padrão = copiar
  copyable?: boolean;          // default true
}
```

**Detecção mobile para drawer:**
```tsx
const isMobile = useIsMobile();
// Em AlterarCelularDialog
return isMobile ? (
  <Drawer open={open} onOpenChange={handleOpenChange}>
    <DrawerTrigger asChild>{trigger}</DrawerTrigger>
    <DrawerContent>{/* mesmo conteúdo dos 3 steps */}</DrawerContent>
  </Drawer>
) : (
  <Dialog>...</Dialog>
);
```

**Membro desde:**
```tsx
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
const memberSince = user?.created_at 
  ? format(new Date(user.created_at), "MMM yyyy", { locale: ptBR })
  : null;
```

---

## Fora de escopo
- Mudar a aba "Dados" dentro de `/perfil` (a refatoração propaga automaticamente pois compartilha o componente)
- Avatar upload (já funciona — apenas reposicionado)
- Nova migration ou alteração de schema

## Resultado esperado
- Tela respira mais, foco no que importa (foto, dados de contato, ações)
- Edição de nome agora possível direto da tela (não existia)
- Alterar celular vira bottom sheet em mobile (gesto natural)
- Touch targets ≥ 56px, tipografia escalada para sênior
- Zero scroll desnecessário no viewport 390x844 (tudo cabe + folga)

