
## Problema

Na página `/` (Central.tsx), no mobile (390x844), os 6 cards do grid ("Resultados", "Estudos", "Fechamentos", "Gerador de Palpite", "Tabela de Movimentação", "Analise do Dia") estão disparando o clique/dropdown durante a tentativa de scroll vertical, prejudicando a UX.

## Causa raiz

Os cards usam `onClick` direto (e `DropdownMenuTrigger` para os com `id`), sem distinguir entre toque rápido (tap) e gesto de scroll. No mobile, qualquer toque sobre a área do card — mesmo durante o início de um scroll — é interpretado como clique imediato.

Fatores que agravam:
- Cards ocupam grande área vertical em duas colunas (alvos grandes = mais fáceis de tocar acidentalmente).
- Não há `touch-action: manipulation` nem delay de threshold.
- O `DropdownMenu` do Radix abre no `pointerdown`, ainda mais sensível que `click`.

## Plano de otimização (somente `src/pages/Central.tsx`)

1. **Adicionar `touch-action: manipulation`** em todos os cards do grid — remove o delay de 300ms mas também evita gestos de double-tap zoom interferindo.

2. **Trocar disparo do dropdown de `pointerdown` para `click`** nos cards com `id` (Fechamentos, Gerador, Tabela, Analise):
   - Usar estado controlado (`useState` para `openDropdown`) e abrir via `onClick` no Card, em vez de deixar o Radix abrir no `pointerdown` do trigger.
   - Isso garante que apenas um tap real (sem movimento) abra o menu.

3. **Detector de scroll vs tap**: implementar pequeno helper inline que captura `touchstart` (Y inicial) e `touchend` (Y final). Se a diferença for > 10px, cancela o clique. Aplicado aos handlers dos 6 cards (`Resultados`, `Estudos` e os 4 com dropdown).

4. **Reduzir feedback visual agressivo**: o `group-active:scale-95` atualmente dispara mesmo em scroll. Substituir por `active:scale-95` + `transition-transform duration-150` somente quando o tap for confirmado (via classe condicional ou simplesmente removendo o scale durante movimento).

5. **Aumentar área de "respiro"**: adicionar `select-none` para evitar seleção de texto acidental durante scroll (já existe parcialmente, garantir em todos).

## Resumo técnico das mudanças

- Arquivo único: `src/pages/Central.tsx`
- Adicionar `useRef` para rastrear `touchStartY`
- Criar handler `handleTouchStart` / `handleTouchEnd` que cancela o `onClick` se houve movimento > 10px
- Aplicar `touch-action: manipulation` (`touch-manipulation` no Tailwind) em todos os 6 cards
- Converter os 4 dropdowns para modo controlado (`open` + `onOpenChange`) e abrir via `onClick` validado pelo handler de scroll
- Manter visual e comportamento desktop intactos (handlers de touch só afetam dispositivos touch)

Sem alterações em outras páginas, componentes, hooks ou backend.
