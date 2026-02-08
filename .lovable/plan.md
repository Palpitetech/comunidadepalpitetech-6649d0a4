
# Plano: Implementar Ferramentas para Dupla Sena

## Resumo das Regras da Dupla Sena

Com base na pesquisa realizada, a **Dupla Sena** possui as seguintes características:

| Característica | Valor |
|----------------|-------|
| **Números no volante** | 1 a 50 (50 dezenas) |
| **Dezenas por aposta** | 6 a 15 números |
| **Dezenas sorteadas** | 6 números por sorteio |
| **Sorteios por concurso** | 2 (Sorteio 1 e Sorteio 2) |
| **Grid do volante** | 5x10 (5 linhas × 10 colunas) |
| **Faixas de premiação** | Sena (6), Quina (5), Quadra (4), Terno (3) |

### Características Especiais
- **DOIS sorteios independentes** por concurso (diferencial único)
- No **Sorteio 1**: só ganha quem acertar a sena (6 números)
- No **Sorteio 2**: ganha quem acertar 3, 4, 5 ou 6 números
- A mesma aposta concorre aos dois sorteios
- Sorteios: terças, quintas e sábados

### Constantes Calculadas para Dupla Sena (1-50)
- **Primos**: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47 (15 números)
- **Múltiplos de 3**: 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48 (16 números)
- **Fibonacci**: 1, 2, 3, 5, 8, 13, 21, 34 (8 números até 50)
- **Moldura** (bordas do grid 5x10): 
  - Linha 1: 1-10
  - Coluna 1: 11, 21, 31, 41
  - Coluna 10: 20, 30, 40, 50
  - Linha 5: 41-50
  - Total: 26 números

---

## Arquivos a Criar

### 1. Biblioteca de Constantes e Funções
**`src/lib/duplasena.ts`**
- Constantes: `TOTAL_DEZENAS_VOLANTE = 50`, `DEZENAS_POR_SORTEIO = 6`
- Arrays: `PRIMOS_DUPLASENA`, `MULTIPLOS_DE_3_DUPLASENA`, `FIBONACCI_DUPLASENA`, `MOLDURA_DUPLASENA`
- Funções: `isPar()`, `isMoldura()`, `isPrimo()`, `getLinha()`, `getColuna()`, etc.
- Grid: 5 linhas × 10 colunas

### 2. Tabela no Banco de Dados
**Migração SQL**: Criar tabela `resultados_duplasena` com estrutura para **dois sorteios**:
```sql
- concurso_id, data_sorteio
- dezenas_sorteio1 (number[]) -- 6 dezenas do 1º sorteio
- dezenas_sorteio2 (number[]) -- 6 dezenas do 2º sorteio
- Indicadores para cada sorteio (qtd_pares_s1, qtd_pares_s2, etc.)
- acumulou, valor_acumulado, premiacao_json
```

### 3. Edge Function de Sincronização
**`supabase/functions/sync-duplasena/index.ts`**
- Integrar com API `apiloterias.com.br` (endpoint: `loteria=duplasena`)
- Processar os dois sorteios separadamente
- Calcular indicadores para ambos

### 4. Hooks de Dados
| Arquivo | Função |
|---------|--------|
| `useDezenasporPosicaoDuplaSena.ts` | Top 5 dezenas por posição (6 posições × 2 sorteios) |
| `useDuplaSenaResultados.ts` | Buscar resultados com paginação |
| `useFrequenciaDuplaSena.ts` | Frequência de dezenas |
| `useTendenciasDuplaSena.ts` | Análise de tendências |
| `useTabelaMovimentacaoDuplaSena.ts` | Ciclos e movimentação |

### 5. Páginas (todas em `src/pages/duplasena/`)
| Página | Rota |
|--------|------|
| `ResultadosDuplaSena.tsx` | `/duplasena/resultados` |
| `TendenciasDuplaSena.tsx` | `/duplasena/tendencias` |
| `FrequenciaDuplaSena.tsx` | `/duplasena/frequencia` |
| `FrequenciaDecenasDuplaSena.tsx` | `/duplasena/frequencia-dezenas` |
| `DezenasporPosicaoDuplaSena.tsx` | `/duplasena/dezenas-por-posicao` |
| `LinhasColunasDuplaSena.tsx` | `/duplasena/linhas-colunas` |
| `TabelaMovimentacaoDuplaSena.tsx` | `/duplasena/tabela-movimentacao` |
| `AnaliseDoDiaDuplaSena.tsx` | `/duplasena/analise-do-dia` |
| `GeradorDuplaSena.tsx` | `/duplasena/gerador` |
| `FechamentoDuplaSena.tsx` | `/duplasena/fechamento` |
| `DesdobramentoDuplaSena.tsx` | `/duplasena/desdobramento` |

### 6. Componentes Visuais
| Componente | Descrição |
|------------|-----------|
| `DezenaCirculoDuplaSena.tsx` | Círculo com cor tema (laranja/vermelho) |
| `DezenaCirculoMiniDuplaSena.tsx` | Versão compacta |
| `ResultadoCardDuplaSena.tsx` | Card mostrando **ambos sorteios** |

### 7. Navegação
- Adicionar seção "Dupla Sena" em `DesktopHeader.tsx` e `MobileMenuSheet.tsx`
- Registrar todas as rotas em `App.tsx`
- Cor tema sugerida: **Laranja/Vermelho** (diferente do roxo Lotofácil e verde Mega Sena)

---

## Detalhes Técnicos

### Estrutura da Tabela de Resultados
```sql
CREATE TABLE resultados_duplasena (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concurso_id INTEGER UNIQUE NOT NULL,
  data_sorteio DATE NOT NULL,
  
  -- Sorteio 1
  dezenas_sorteio1 INTEGER[] NOT NULL,
  qtd_pares_s1 INTEGER,
  qtd_impares_s1 INTEGER,
  qtd_moldura_s1 INTEGER,
  qtd_primos_s1 INTEGER,
  qtd_repetidas_s1 INTEGER,
  
  -- Sorteio 2
  dezenas_sorteio2 INTEGER[] NOT NULL,
  qtd_pares_s2 INTEGER,
  qtd_impares_s2 INTEGER,
  qtd_moldura_s2 INTEGER,
  qtd_primos_s2 INTEGER,
  qtd_repetidas_s2 INTEGER,
  
  -- Premiação
  acumulou BOOLEAN,
  valor_acumulado NUMERIC,
  valor_estimado_proximo NUMERIC,
  premiacao_json JSONB,
  local_sorteio TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Grid do Volante (5x10)
```text
Linha 1: [01] [02] [03] [04] [05] [06] [07] [08] [09] [10]
Linha 2: [11] [12] [13] [14] [15] [16] [17] [18] [19] [20]
Linha 3: [21] [22] [23] [24] [25] [26] [27] [28] [29] [30]
Linha 4: [31] [32] [33] [34] [35] [36] [37] [38] [39] [40]
Linha 5: [41] [42] [43] [44] [45] [46] [47] [48] [49] [50]
```

### Diferencial: Interface para Dois Sorteios
Cada página de análise precisará considerar:
- Toggle ou abas para alternar entre "Sorteio 1" e "Sorteio 2"
- Estatísticas combinadas ou separadas por sorteio
- Cards de resultados mostrando ambos os sorteios lado a lado

---

## Ordem de Implementação

1. **Fase 1 - Fundação**
   - Criar `src/lib/duplasena.ts` com constantes e funções
   - Criar tabela `resultados_duplasena` via migração
   - Criar edge function `sync-duplasena`

2. **Fase 2 - Dados e Hooks**
   - Criar hooks de consulta (resultados, frequência, tendências)
   - Sincronizar primeiros resultados via edge function

3. **Fase 3 - Páginas Base**
   - Resultados (com visualização dos dois sorteios)
   - Frequência e Tendências
   - Dezenas por Posição

4. **Fase 4 - Ferramentas Avançadas**
   - Gerador de Palpites
   - Fechamento
   - Desdobramento

5. **Fase 5 - Navegação**
   - Adicionar menu Dupla Sena no header/menu mobile
   - Registrar todas as rotas

---

## Estimativa
- **Total de arquivos novos**: ~25-30 arquivos
- **Arquivos modificados**: 3 (App.tsx, DesktopHeader.tsx, MobileMenuSheet.tsx)
- **Migração de banco**: 1 tabela nova
- **Edge Functions**: 1 nova (sync-duplasena)
