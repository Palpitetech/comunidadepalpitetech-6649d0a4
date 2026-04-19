

## Diagnóstico — Varredura completa do `MobileMenuSheet.tsx`

### 🔴 CÓDIGO MORTO (alta prioridade)

**1. Imports de ícones não utilizados** (linhas 31-36)
9 ícones são importados mas **nunca referenciados** no JSX deste arquivo. Eles são entregues indiretamente via `tool.icon` dos arrays do `AppHeader`:
- `Target`, `Table2`, `Flame`, `Dices`, `Shuffle`, `LayoutGrid`, `Grid3X3`, `TrendingUp`, `TrendingDown`

**Mantidos (em uso real):** `ArrowLeft`, `Home`, `BarChart3` (header do accordion), `MessageCircle`, `LogOut`, `Gift`, `User`, `CreditCard`, `Ticket`, `Lock`

**2. Linhas em branco duplicadas** (linhas 45-46, 51-52)
Duas quebras de linha duplas consecutivas entre imports e a interface, e entre a interface e a função. Estilo inconsistente com o resto da base.

**3. Função `closeAndNavigate` redundante** (linhas 76-78)
É só um wrapper de `onOpenChange(false)`. Usada em 6 lugares — é aceitável pela legibilidade, mas poderia simplesmente chamar `onOpenChange(false)` direto. **Manter por clareza**, sem ação.

**4. Tipo `any[]` no `LotteryAccordion`** (linha 106)
`tools: any[]` deveria ser `tools: ToolItem[]` (já importado na linha 43). Tipagem fraca = potencial bug silencioso.

### 🟠 INCONSISTÊNCIAS VISUAIS

**5. Número de WhatsApp de suporte ERRADO** (linha 104)
Usa `5516997175392`, mas a regra de memória `mem://support/contact-info` define que o **número oficial é `51981854281`** (mesmo usado em `src/lib/boloes.ts` para Bolões e nas notificações de assinatura).
- Mantém a inconsistência: usuário recebe suporte em número diferente do que vê em Bolões/cobranças.
- O outro local que também usa o número errado é `LoginWizard.tsx` (linha 46) — mas isso está fora do escopo deste menu.

**6. `LotteryAccordion` — divisor visual incoerente** (linhas 117-135)
A lógica atual de divisor é confusa:
- Linha 120: `{idx > 0 && tool.bold && <div border-t />}` → divisor ANTES de itens bold (mas só "Ver Todas as Ferramentas" é bold, e ele é sempre `idx === 0`, então **essa condição NUNCA dispara**).
- Linha 134: `{idx === 0 && <div border-t />}` → divisor depois do primeiro item.

Ou seja: **a linha 120 é código morto** (condição impossível dado os arrays atuais). Apenas a linha 134 efetivamente renderiza um divisor (após "Ver Todas as Ferramentas").

**7. Padding interno desigual no accordion** (linha 107)
`p-1` no container externo + `pl-8` interno (linha 117) gera margem visual irregular nas laterais. O `mx-4` cria recuo de 16px externo, mas o `p-1` interno (4px) deixa o conteúdo colado na borda colorida esquerda.

**8. SIMPLE_LOTTERIES — sem divisor visual claro** (linhas 279-287)
Os itens "Dia de Sorte" e "Lotomania" aparecem sem ícone nem identidade visual de cor (diferente dos accordions acima). Visualmente "soltos", parecem itens desconectados.

**9. Header do sheet — alinhamento do badge "Plano"** (linhas 176-182)
O badge de plano (`Premium`/`Teste Vencido`/`Plano Free`) fica abaixo do bloco "nome + avatar" usando `flex-col items-end`. No mobile estreito (<360px), o texto "Plano Free" pode ficar empilhado ou cortado pelo `gap-0.5`.

**10. Botão "Sair" duplicado** (dropdown do perfil + rodapé do sheet)
- Linha 219-224: "Sair" no DropdownMenu do perfil.
- Linha 304-309: "Sair" no rodapé do sheet (só visível se `isAuthenticated`).

Não é exatamente código morto — é redundância de UX. O usuário tem 2 botões "Sair" idênticos no mesmo painel.

**11. `getInitials` declarada mas o avatar tem fallback raso** (linhas 71-74)
A função existe e é usada (linha 172), está OK. Sem ação — só registro.

### 🟡 OBSERVAÇÕES MENORES

**12. `paddingTop` inline no header do sheet** (linha 154)
Usa `style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))' }}` para safe-area do iPhone. Funciona, mas a base usa `pt-[env(safe-area-inset-top)]` via Tailwind nos outros lugares (`AppHeader`). Inconsistência de padrão.

**13. `z-[110]` e `z-[120]` mágicos** (linhas 147 e 185)
Valores arbitrários sem token. Não quebra nada, mas dificulta manutenção. (Comum no projeto, não é crítico.)

---

## Plano de correções (3 etapas, 1 arquivo)

### Etapa 1 — Limpar código morto
**Sub-1.1**: Remover 9 imports de ícones não usados (linhas 31-36 → manter só os 10 efetivamente usados).
**Sub-1.2**: Remover linhas em branco duplicadas (45-46, 51-52).
**Sub-1.3**: Remover a condição morta `idx > 0 && tool.bold` na linha 120 (nunca dispara dado o shape atual dos arrays).
**Sub-1.4**: Tipar `tools: ToolItem[]` no `LotteryAccordion` em vez de `any[]` (linha 106).

### Etapa 2 — Corrigir inconsistências visuais críticas
**Sub-2.1**: Trocar número de WhatsApp na linha 104 de `5516997175392` para `5551981854281` (alinhar com `mem://support/contact-info` e `src/lib/boloes.ts`).
**Sub-2.2**: Ajustar padding interno do `LotteryAccordion` (linha 107): trocar `p-1` por `py-1 pl-2 pr-1` para dar respiro à esquerda da borda colorida.
**Sub-2.3**: Adicionar `min-w-0 truncate` ao bloco do badge de plano no header (linhas 164-183) para evitar quebra em telas <360px.

### Etapa 3 — Decisão sobre redundância "Sair"
**Sub-3.1**: Manter "Sair" apenas no DropdownMenu do perfil (linhas 219-224) e **remover** o duplicado do rodapé (linhas 304-309). Mantém "Convidar Amigos" e "Suporte WhatsApp" no rodapé. Mais limpo, sem perda de função.

## Arquivo afetado (1)

- `src/components/layout/MobileMenuSheet.tsx`

## Garantias

- **Zero alteração** em outros arquivos (`AppHeader`, `MainLayout`, hooks, edge functions).
- **Zero alteração** funcional além da remoção do "Sair" duplicado.
- **Zero alteração** em estilos globais ou tokens de design.
- Código morto eliminado: 9 ícones + 2 blocos de linhas em branco + 1 condição impossível + tipagem `any` corrigida.
- Inconsistências resolvidas: número de suporte unificado, padding do accordion equilibrado, header do perfil sem quebra em telas estreitas, botão "Sair" único.

