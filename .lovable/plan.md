

# Refatorar páginas do menu do usuário (Mobile-First) + remover Ajuda

## Objetivo
Padronizar as 4 páginas do dropdown de perfil (Dados, Transações, Assinatura, Segurança), reaproveitando o padrão estabelecido em **Meus Dados** (cards `rounded-2xl`, ícones coloridos h-10, tipografia escalada para sênior, touch targets ≥56px). Otimizar a página de **Transações**, corrigir o botão **Grupo WhatsApp** em Segurança para usar smart link com diferenciação por plano, e **remover Ajuda** completamente (rotas, links e arquivos).

---

## Visão geral por página

```text
┌────────────────────────────────────────┐
│ ←     [Título da página]               │ header padrão (mantém)
├────────────────────────────────────────┤
│  ╔══════╗                              │
│  ║avatar║  Bruno Silveira              │ ← MINI HERO compartilhado
│  ╚══════╝  Plano Premium · ativa       │
├────────────────────────────────────────┤
│  [Conteúdo específico da página]       │
└────────────────────────────────────────┘
```

Cada página (Transações, Assinatura, Segurança) ganha o mesmo **mini-hero** de identidade visual no topo (avatar h-14 + nome + plano), criando coesão entre as 4 telas.

---

## 1. Padronização compartilhada

### Novo componente: `PerfilMiniHero.tsx`
- Avatar h-14 w-14 (não editável, só visual)
- Nome (text-base font-semibold) + linha sutil "Plano [X] · [status]"
- Padding `px-4 py-4`, separador inferior
- Recebe `profile`, `user`

Inserido no topo de:
- `PerfilTransacoes.tsx`
- `PerfilAssinatura.tsx`
- `PerfilSeguranca.tsx`

(`PerfilDados.tsx` mantém o `PerfilDadosHero` maior com avatar 80x80 — é a tela "principal" do perfil)

---

## 2. Página Transações — otimização completa

**Problemas atuais:**
- Tabs internas (`Log`/`Cotas`/`Premiações`) ficam apertadas em mobile
- Cards densos, valores pequenos, pouca distinção visual entre entrada/saída
- Sem totalizador/saldo no topo
- Sem filtro de período
- Datas curtas, sem agrupamento

**Mudanças:**

### 2.1 Header de saldo (novo)
```text
┌──────────────────────────────────┐
│ 💰 Saldo total                   │
│ R$ 127,50                        │
│ ↑ R$ 200,00 entradas             │
│ ↓ R$ 72,50 saídas                │
└──────────────────────────────────┘
```
Calculado do array `movimentacoes` no client.

### 2.2 Filtro de período (chips horizontais)
- `Tudo` · `7 dias` · `30 dias` · `90 dias`
- ScrollArea horizontal para não quebrar em mobile pequeno
- Filtra todas as 3 abas

### 2.3 Tabs com ícones + contadores
- `Log (12)` `Cotas (3)` `Prêmios (1)`
- Aumentar h-10 → h-11, font-medium

### 2.4 Lista Log redesenhada (`MovimentacaoRow`)
- Ícone esquerdo colorido por tipo: entrada (verde), saída (vermelho), prêmio (âmbar), bônus (roxo)
- 2 linhas: descrição (text-sm font-medium) + data relativa ("Há 2 dias")
- Valor à direita em destaque (text-base font-bold), cor por tipo
- Agrupamento por dia com separador `text-[11px] uppercase` ("Hoje", "Ontem", "12 mar")

### 2.5 Cotas/Prêmios redesenhados
- Card com gradient sutil quando `status="pago"` ou prêmio recebido
- Loteria como chip colorido (cor da loteria do `mem://design/lottery-branding-colors`)
- Concurso + código do bolão em destaque
- Tap na linha → navega para `/boloes/[codigo]` (se existir)

### 2.6 Estado vazio melhorado
- Ilustração maior (Wallet/Ticket/Trophy h-12), copy amigável + CTA "Explorar Bolões" → `/boloes`

---

## 3. Página Assinatura — refinamento

**Mudanças:**

### 3.1 Card de status visual
- Substitui o card horizontal atual por um **card de destaque** com gradient (gold para Premium / cinza para Grátis)
- Ícone Crown grande (h-8) centralizado
- Plano em text-2xl bold
- Status badge logo abaixo (sem border)

### 3.2 Linha de informações (cards individuais)
- Vencimento → card próprio com ícone Calendar
- Dias restantes (calculado) → "Faltam X dias" ou "Vence hoje" / "Vencido há X dias"
- Próxima cobrança (se mensal recorrente)

### 3.3 CTAs reorganizadas
- Primário grande: "Trocar Plano" / "Ver Planos" (h-12, gradient primary)
- Secundário discreto: "Cancelar Assinatura" (variant ghost, text-destructive, h-10)
- Cancelar fica embaixo, separado por divisor

### 3.4 Histórico curto (novo, opcional)
- "Suas últimas transações" → 3 últimas movimentações com link "Ver todas →" para `/perfil/transacoes`

---

## 4. Página Segurança — refinamento + correção do Grupo WhatsApp

### 4.1 Correção crítica: Grupo WhatsApp
**Problema:** atualmente usa `https://chat.whatsapp.com/J89dx46Lo97G9YdAaGmR78` direto, sem smart link e sem distinção por plano.

**Correção:** replicar a lógica de `Comunidade.tsx`/`Index.tsx`:
```tsx
const isTrial = plan?.slug === 'trial' || plan?.slug === 'teste-gratis-3-dias';
const isPaid = !!plan && !isTrial;
const link = isPaid 
  ? "https://www.palpitetech.com.br/g/grupo-vip-assinantes" 
  : "https://www.palpitetech.com.br/g/entrar-sala-secreta";
```
- Importa `usePermissionContext` para obter `plan`
- Label dinâmico: "Grupo VIP Assinantes" (pago) ou "Sala Secreta" (grátis/trial)
- Subtítulo: "Acesso exclusivo dos assinantes" ou "Comunidade aberta"
- Mantém o smart link engine (passa pelo `/g/...` e respeita lógica anti-internal-browser)

### 4.2 Reorganização visual
- **Seção "Conta"**: Trocar Senha + Privacidade
- **Separador + label de seção** "Comunidade": Grupo WhatsApp
- **Botão Sair fora dos cards** (já está, mantém), mas com variant `outline` em vermelho sutil para dar peso

### 4.3 Trocar Senha — Drawer no mobile
- Mesmo padrão usado em `EditarNomeDrawer.tsx`: `useIsMobile()` decide entre Drawer (bottom sheet) e Dialog
- OTP/input maior, mais confortável em mobile

### 4.4 Confirmação de Logout
- Adicionar `AlertDialog` antes do `signOut()` (evita logout acidental por toque)
- "Tem certeza que deseja sair? Você precisará fazer login novamente."

---

## 5. Remoção da página Ajuda

### Arquivos a deletar:
- `src/pages/Ajuda.tsx`
- `src/pages/AjudaDetalhes.tsx`
- `src/components/ajuda/AjudaTemplate.tsx` (e pasta `src/components/ajuda/` se ficar vazia)

### Arquivos a editar:
- `src/App.tsx` — remover imports `Ajuda`, `AjudaDetalhes` e as rotas `/ajuda` e `/ajuda/:slug`
- `src/components/layout/AppHeader.tsx` (linha ~501) — remover o `DropdownMenuItem` "Ajuda" (e import `HelpCircle` se não usado em outro lugar)
- `src/components/layout/MobileMenuSheet.tsx` — verificar e remover qualquer link para `/ajuda`

> A tabela `help_content` no banco **NÃO** será removida (preserva conteúdo SEO). Se quiser remover depois, criamos migration separada.

---

## 6. Outras melhorias mobile compartilhadas

- Em todos os 4 wrappers (`PerfilDados/Transacoes/Assinatura/Seguranca.tsx`):
  - `pb-8` → `pb-24` (folga para área segura iOS + bottom nav)
  - `max-w-lg mx-auto` → `max-w-xl mx-auto` (um pouco mais largo em tablets)
- Adicionar `overscroll-contain` no `ScrollArea` para evitar pull-to-refresh acidental
- Padronizar título do header `text-lg font-semibold` (já está)

---

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/components/perfil/PerfilMiniHero.tsx` | **Novo** — hero compacto compartilhado |
| `src/components/perfil/TransacoesTab.tsx` | **Reescrever** — saldo, filtros, agrupamento por data, rows redesenhadas |
| `src/components/perfil/AssinaturaTab.tsx` | **Reescrever** — card destaque, dias restantes, histórico curto |
| `src/components/perfil/SegurancaTab.tsx` | **Reescrever** — smart link grupo, drawer mobile p/ senha, confirm logout |
| `src/pages/PerfilTransacoes.tsx` | **Editar** — adicionar `<PerfilMiniHero />` |
| `src/pages/PerfilAssinatura.tsx` | **Editar** — adicionar `<PerfilMiniHero />` |
| `src/pages/PerfilSeguranca.tsx` | **Editar** — adicionar `<PerfilMiniHero />` |
| `src/pages/Ajuda.tsx` | **Deletar** |
| `src/pages/AjudaDetalhes.tsx` | **Deletar** |
| `src/components/ajuda/AjudaTemplate.tsx` | **Deletar** |
| `src/App.tsx` | **Editar** — remover imports e rotas Ajuda |
| `src/components/layout/AppHeader.tsx` | **Editar** — remover item "Ajuda" do dropdown |
| `src/components/layout/MobileMenuSheet.tsx` | **Editar** — remover link "Ajuda" se existir |

---

## Detalhes técnicos sensíveis

**Smart link Grupo WhatsApp (SegurancaTab):**
```tsx
import { usePermissionContext } from "@/contexts/PermissionContext";

const { plan } = usePermissionContext();
const isTrial = plan?.slug === 'trial' || plan?.slug === 'teste-gratis-3-dias';
const isPaid = !!plan && !isTrial;
const groupLink = isPaid 
  ? "https://www.palpitetech.com.br/g/grupo-vip-assinantes" 
  : "https://www.palpitetech.com.br/g/entrar-sala-secreta";
const groupLabel = isPaid ? "Grupo VIP Assinantes" : "Sala Secreta";
```

**Agrupamento por data (TransacoesTab):**
```tsx
import { isToday, isYesterday, format } from "date-fns";
import { ptBR } from "date-fns/locale";

function groupByDay(items) {
  return items.reduce((acc, item) => {
    const d = new Date(item.created_at);
    const key = isToday(d) ? "Hoje" : isYesterday(d) ? "Ontem" : format(d, "dd 'de' MMM", { locale: ptBR });
    (acc[key] ||= []).push(item);
    return acc;
  }, {} as Record<string, typeof items>);
}
```

**Dias restantes (AssinaturaTab):**
```tsx
import { differenceInDays } from "date-fns";
const dias = subscription?.validade ? differenceInDays(new Date(subscription.validade), new Date()) : null;
const diasLabel = dias === null ? null
  : dias < 0 ? `Vencido há ${Math.abs(dias)} dia(s)`
  : dias === 0 ? "Vence hoje"
  : `Faltam ${dias} dia(s)`;
```

**Drawer/Dialog responsivo (TrocarSenha):** mesmo padrão do `EditarNomeDrawer.tsx` já existente.

---

## Fora de escopo
- Mexer na página `/convites` (já tem layout próprio que funciona — apenas mantida no menu)
- Avatar editável nas 3 páginas secundárias (só `PerfilDados` permite editar)
- Migration para limpar tabela `help_content`
- Mudar a aba "Transações" interna do `/perfil` (compartilha o componente — propaga automaticamente)

## Resultado esperado
- 4 páginas do perfil com **identidade visual coesa** (mini hero + cards arredondados + tipografia sênior)
- Transações **escaneável**: saldo no topo, filtros rápidos, agrupamento por dia, valores com cor
- Assinatura **mais clara**: status visual, dias restantes, ações priorizadas
- Segurança **funcional**: Grupo WhatsApp respeita plano (corrige bug atual), troca de senha em drawer mobile, logout protegido
- **Ajuda removida** sem rotas órfãs nem links quebrados

