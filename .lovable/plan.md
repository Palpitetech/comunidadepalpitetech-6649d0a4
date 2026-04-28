# Refatoração visual do menu lateral mobile

Refatorar **apenas o visual e a UX** do `src/components/layout/MobileMenuSheet.tsx`, deixando-o idêntico em comportamento e rotas, mas com layout limpo, padronizado e otimizado para +50, baseado na imagem de referência.

## Escopo

- Arquivo único: `src/components/layout/MobileMenuSheet.tsx`
- Não alterar `AppHeader.tsx`, rotas, `featureMap`, hubs ou qualquer outro arquivo.
- Manter exports `LOTOFACIL_TOOLS`, `MEGASENA_TOOLS`, etc. intactos (continuam usados pelo header desktop).

## Mudanças visuais

### 1. Topo do menu (header)
Manter o `Voltar` à esquerda. Substituir o dropdown atual do usuário por um **card branco arredondado** (12px, sombra suave) contendo:
- Avatar grande (56px) à esquerda
- Nome do usuário (18px, bold)
- Status do plano com bolinha colorida:
  - `Premium` → bolinha verde
  - `Plano expirado` → bolinha vermelha (quando `trial_used` e sem assinatura)
  - `Plano Free` → bolinha cinza
- Botão CTA logo abaixo, full-width dentro do card:
  - Não-assinante → **"Renovar acesso"** (vermelho/destructive) ou **"Assinar agora"** (free), linkando para `/perfil/assinatura`
  - Assinante ativo → ocultar o CTA
- Ao tocar no card (fora do CTA) → abre o dropdown atual com Dados/Transações/Assinatura/Segurança/Convidar/Sair (mesmas opções de hoje, sem perder nada).
- Não autenticado → card "Entrar" com mesmo estilo, linkando `/login`.

### 2. Seção LOTERIAS (lista única padronizada)

**Remover:**
- Os 4 accordions (`LotteryAccordion`) com sub-ferramentas.
- A seção separada `SIMPLE_LOTTERIES` (Dia de Sorte / Lotomania) renderizada à parte.
- O link "Início" superior (substituído pelo card do usuário + lista; usuário acessa Início pelo bottom nav existente). Se preferir, mantemos um item discreto "Início" acima do label LOTERIAS — confirmar se quiser.

**Adicionar:** rótulo `LOTERIAS` (uppercase, 12px, muted) e abaixo uma **lista única e contínua** com 6 cards padronizados, todos clicáveis, navegando direto para o **hub** de cada loteria:

| Loteria | Rota | Cor (HSL) |
|---|---|---|
| Lotofácil | `/lotofacil` | `270 60% 50%` (roxo) |
| Mega Sena | `/megasena` | `145 63% 42%` (verde) |
| Dupla Sena | `/duplasena` | `0 75% 55%` (vermelho) |
| Quina | `/quina` | `210 80% 45%` (azul) |
| Dia de Sorte | `/diadesorte` | `45 95% 55%` (amarelo) |
| Lotomania | `/lotomania` | `25 90% 55%` (laranja) |

**Padrão do card** (idêntico para todos):
- Container: `bg-white`, `rounded-xl` (12px), `shadow-sm`, `border-l-4` na cor da loteria, fundo com tonalidade leve da cor (`hsl(var --cor) / 0.05`)
- Padding interno: `p-4` (16px)
- Espaçamento vertical entre cards: `gap-2.5` (~10px)
- Conteúdo (flex row, items-center):
  - Quadrado 44x44 `rounded-lg` com fundo na cor cheia da loteria + ícone branco padronizado **`Ticket`** (lucide) — mesmo ícone para todas, conforme pedido
  - Nome da loteria: 17px, `font-semibold`, `text-foreground`
  - À direita: `ChevronRight` na cor da loteria
- Estados:
  - `active:scale-[0.98]` + `transition-all duration-150`
  - `hover:shadow-md` no desktop
  - Tap target ≥44px (já garantido pelo padding)

### 3. Seção BENEFÍCIOS (mesmo padrão de card)
Rótulo `BENEFÍCIOS` (mesmo estilo do label LOTERIAS) e dois cards seguindo o mesmo molde dos cards de loteria:
- **Ganhar Assinatura Grátis** → `/convites`, ícone `Gift`, cor primary (roxo)
- **Suporte WhatsApp** → link `wa.me/...`, ícone `MessageCircle`, cor verde WhatsApp

### 4. Rodapé
Pequeno texto centralizado, muted, com ícone `Lock`: **"Seus dados estão protegidos"** (igual à imagem).

## Tipografia e espaçamento (resumo)

- Nome do item: 17px / `font-semibold`
- Labels de seção: 12px uppercase, `tracking-wider`, `text-muted-foreground`, `mb-3`
- Padding do container do menu: `px-4 py-5`
- Gap entre cards: 10px
- Gap entre seções: 24px

## Comportamento preservado

- Sheet abre/fecha via `open` / `onOpenChange` (sem mudança de API)
- Clique em qualquer card fecha o sheet (`closeAndNavigate`)
- Lógica de gating/upgrade modal continua disponível, mas não é mais necessária na lista de loterias (os hubs já cuidam disso); mantemos `UpgradeModal` no return para não quebrar nada.
- Imports `LOTOFACIL_TOOLS`, etc. removidos deste arquivo (não usados aqui), mas continuam exportados em `AppHeader.tsx` e usados pelo header desktop.

## Detalhes técnicos

- Cores aplicadas via style inline `{ borderLeftColor: hsl(...), backgroundColor: hsl(... / 0.05) }` para evitar criar tokens novos.
- Componente único interno `LotteryCard({ name, color, to })` reaproveitado pelos 6 itens e pelos 2 cards de benefícios (variante `BenefitCard` com `icon` customizado).
- Sem dependências novas; usa apenas ícones já no projeto (`Ticket`, `ChevronRight`, `Gift`, `MessageCircle`, `Lock`).

## Fora de escopo

- Header desktop (`AppHeader`)
- Bottom nav
- Rotas, gating, permissões, auth, dados de loteria
