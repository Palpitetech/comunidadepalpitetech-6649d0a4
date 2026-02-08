
# Plano: Testar Garantia do Fechamento

## Objetivo
Criar um sistema de simulação que testa a garantia matemática do fechamento, sorteando 15 dezenas aleatórias dentre as selecionadas e mostrando quantos prêmios seriam ganhos com os jogos gerados.

---

## O que será feito

### 1. Remover botão "Novo Fechamento"
O botão atual será substituído pelo novo botão de teste.

### 2. Adicionar botão "Testar Garantia"
- Ícone de teste/simulação (FlaskConical ou Dice)
- Ao clicar, simula um sorteio com 15 dezenas
- Mostra os resultados em uma tabela

### 3. Lógica de Simulação
A simulação irá:
1. Pegar as dezenas originais selecionadas (ex: 16 para FC01)
2. Sortear aleatoriamente 15 delas (simulando o resultado da Lotofácil)
3. Comparar cada jogo gerado contra o "resultado simulado"
4. Contar quantos acertos cada jogo teve
5. Agrupar por faixa de premiação (15, 14, 13, 12, 11 pontos)

### 4. Tabela de Resultados
Exibir após a simulação:

```text
┌─────────────────────────────────────────────┐
│ Resultado Simulado                          │
│ 01 - 03 - 05 - 07 - 09 - 10 - 11 - 12 - 14 │
│ 15 - 17 - 18 - 20 - 22 - 25                │
├─────────────────────────────────────────────┤
│ Premiações                                  │
├──────────────┬──────────────────────────────┤
│ 15 pontos    │ 0 jogo(s)                    │
│ 14 pontos    │ 1 jogo(s) ✓ Garantia        │
│ 13 pontos    │ 3 jogo(s)                    │
│ 12 pontos    │ 0 jogo(s)                    │
│ 11 pontos    │ 0 jogo(s)                    │
└──────────────┴──────────────────────────────┘
```

### 5. Indicador de Garantia Cumprida
- Destacar visualmente quando a garantia é atingida
- Badge verde ao lado da faixa que cumpre a garantia
- Mensagem de sucesso ou falha

---

## Arquivos a modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/lib/fechamento.ts` | Adicionar função `simularGarantia()` |
| `src/components/fechamento/ResultadosFechamento.tsx` | Remover "Novo Fechamento", adicionar "Testar Garantia" + tabela de resultados |

---

## Detalhes Técnicos

### Nova função em `fechamento.ts`

```typescript
interface ResultadoSimulacao {
  resultadoSimulado: number[];
  acertosPorJogo: number[];
  contagem: Record<number, number>; // { 15: 0, 14: 1, 13: 2, ... }
  garantiaCumprida: boolean;
}

function simularGarantia(
  dezenasSelecionadas: number[],
  jogos: number[][],
  garantia: number
): ResultadoSimulacao
```

### Componente de Tabela
- Usar componentes `Table` existentes do shadcn/ui
- Estilo compacto e legível
- Highlight especial na linha da garantia

---

## Fluxo do Usuário

1. Usuário gera o fechamento normalmente
2. Vê os jogos gerados com a toolbar de ações
3. Clica em "Testar Garantia"
4. Sistema sorteia 15 números das dezenas originais
5. Tabela aparece mostrando o resultado simulado e a contagem de prêmios
6. Usuário pode clicar novamente para nova simulação
