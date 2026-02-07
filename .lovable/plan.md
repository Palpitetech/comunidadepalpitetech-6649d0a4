
# Plano: Refatorar Página do Gerador de Palpites

## Objetivo
Redesenhar a página `/gerador` com uma experiência mais limpa e focada, separando a configuração dos resultados em duas telas distintas.

---

## Fluxo do Usuário

```text
┌─────────────────────────────────┐
│     TELA 1: CONFIGURAÇÃO        │
│  (Página /gerador - Compacta)   │
├─────────────────────────────────┤
│                                 │
│   ┌─────────────────────────┐   │
│   │  Quantos palpites?      │   │
│   │  [1][2][3][4][5][6]...  │   │
│   └─────────────────────────┘   │
│                                 │
│   ┌─────────────────────────┐   │
│   │  Dezenas por palpite?   │   │
│   │  [15][16][17][18][19]   │   │
│   │        [20]             │   │
│   └─────────────────────────┘   │
│                                 │
│   ┌─────────────────────────┐   │
│   │     GERAR PALPITES      │   │
│   └─────────────────────────┘   │
│                                 │
│   "Você pode gerar 3x hoje"    │
└─────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│   TELA 2: RESULTADOS (MODAL)    │
│    (Fullscreen / Sheet)         │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │ ☑ Copiar Selecionados     │  │
│  │ 📋 Copiar Todos           │  │
│  │ 🗑 Excluir Selecionados   │  │
│  │ ❌ Excluir Todos          │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ [☐] Palpite 1             │  │
│  │ 01 02 03 04 05 06 07 08   │  │
│  │ 09 10 11 12 13 14 15      │  │
│  │ Ímpares: 7 | Moldura: 10  │  │
│  │ Repetidas: 5 | Múlt.3: 5  │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ [☐] Palpite 2             │  │
│  │ ... (mesmo layout)        │  │
│  └───────────────────────────┘  │
│                                 │
│   Página 1 de 2  [<] [>]       │
└─────────────────────────────────┘
```

---

## O Que Será Criado/Modificado

### Arquivos Novos
| Arquivo | Descrição |
|---------|-----------|
| `src/components/gerador/DezenasSelector.tsx` | Seletor para quantidade de dezenas (15-20) |
| `src/components/gerador/PalpiteCard.tsx` | Card visual de cada palpite com checkbox e estatísticas |
| `src/components/gerador/ResultadosSheet.tsx` | Modal fullscreen com lista de palpites e ações em lote |

### Arquivos Modificados
| Arquivo | Mudanças |
|---------|----------|
| `src/pages/Gerador.tsx` | Layout limpo com 2 seletores + botão + status |
| `src/hooks/useGerador.ts` | Adicionar parâmetro `qtdDezenas` na requisição |
| `supabase/functions/generate-palpites/index.ts` | Aceitar `qtdDezenas` (15-20) e gerar jogos dinâmicos |
| `src/lib/lotofacil.ts` | Adicionar função para contar múltiplos de 3 |

---

## Detalhes Técnicos

### 1. Novo Seletor de Dezenas
Componente similar ao `QuantidadeSelector`, mas com opções fixas: **15, 16, 17, 18, 19, 20**.

### 2. Cálculo de Estatísticas
Cada palpite exibirá:
- **Ímpares**: Quantidade de números ímpares
- **Repetidas**: Comparação com último concurso (buscar do banco)
- **Moldura**: Dezenas nas bordas do volante
- **Múltiplo de 3**: Dezenas divisíveis por 3 (3, 6, 9, 12, 15, 18, 21, 24)

### 3. Funcionalidades da Tela de Resultados
| Ação | Comportamento |
|------|---------------|
| Copiar Selecionados | Copia apenas os palpites marcados |
| Copiar Todos | Copia todos os palpites formatados |
| Excluir Selecionados | Remove palpites marcados da lista |
| Excluir Todos | Limpa a lista e volta à configuração |

### 4. Paginação
- Máximo de **12 palpites por página**
- Navegação simples com botões anterior/próximo

### 5. Edge Function Atualizada
```typescript
// Novo parâmetro aceito
const qtdDezenas = Math.min(Math.max(body.qtdDezenas || 15, 15), 20);

// Prompt atualizado para a IA
`Gere ${quantidade} jogo(s) com EXATAMENTE ${qtdDezenas} dezenas cada.`
```

---

## Mudanças Visuais

### Página de Configuração (Limpa)
- Header minimalista: apenas título + ícone
- 2 seletores com labels claros
- Botão de ação grande e destacado
- Status de uso discreto no rodapé

### Modal de Resultados (Fullscreen)
- Barra de ações fixa no topo
- Cards de palpite com checkbox para seleção
- Dezenas em formato 8+7 (ou 8+8 para 16, etc.)
- Linha de estatísticas compacta
- Paginação se necessário

---

## Sequência de Implementação

1. Criar função `contarMultiplosDe3` em `src/lib/lotofacil.ts`
2. Criar componente `DezenasSelector.tsx`
3. Criar componente `PalpiteCard.tsx` com layout visual e checkbox
4. Criar componente `ResultadosSheet.tsx` com ações e paginação
5. Atualizar `useGerador.ts` para aceitar `qtdDezenas`
6. Atualizar Edge Function `generate-palpites` para processar `qtdDezenas`
7. Refatorar `Gerador.tsx` com novo layout limpo
8. Testar fluxo completo
