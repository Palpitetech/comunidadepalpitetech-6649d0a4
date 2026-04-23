

## Enriquecer os Posts de Linhas e Colunas com estudo profundo

Hoje os posts de Linhas e Colunas são apenas listas de médias por eixo (ex.: "Linha 3 (11-15): 28 ocorrências — mais comum: 3 dezenas (5x)"). Sem direção, sem padrão de jogo, sem dezenas específicas. Vamos transformar nos posts mais ricos da série, com **distribuição alvo, dezenas quentes/frias dentro de cada eixo, melhores duplas/trios por eixo e palpite estruturado**.

## Como vai ficar (exemplo Linhas)

```text
📐 Análise por Linhas — Concurso 3668

Olá pessoal!

📊 Panorama (últimos 10 sorteios — 150 dezenas)
A Lotofácil usa grid 5x5, então cada linha tem 5 dezenas (01-05, 06-10, 11-15, 16-20, 21-25).
Em 10 sorteios, cada linha contribui em média com 3 dezenas — mas o real varia bastante.

🎯 Distribuição média por linha
• L1 (01-05): 3.1 dezenas/sorteio  → padrão mais comum: 3 dezenas (6x), 4 dezenas (3x)
• L2 (06-10): 2.8 dezenas/sorteio  → padrão mais comum: 3 dezenas (5x), 2 dezenas (4x)
• L3 (11-15): 3.2 dezenas/sorteio  → padrão mais comum: 3 dezenas (5x), 4 dezenas (3x)
• L4 (16-20): 2.9 dezenas/sorteio  → padrão mais comum: 3 dezenas (6x), 2 dezenas (3x)
• L5 (21-25): 3.0 dezenas/sorteio  → padrão mais comum: 3 dezenas (7x)

🔥 Dezenas FORTES por linha (top performer de cada eixo)
• L1: dezena 03 (saiu 9x em 10) e 05 (saiu 8x)
• L2: dezena 09 (8x) e 07 (7x)
• L3: dezena 11 (10x) e 13 (8x)
• L4: dezena 20 (8x) e 17 (7x)
• L5: dezena 25 (9x) e 21 (8x)

❄️ Dezenas FRACAS por linha (atenção)
• L1: 04 (3x em 10) e 02 (4x)
• L2: 06 (2x) — a mais fria do grid
• L3: 12 (3x)
• L4: 19 (3x) e 16 (4x)
• L5: 24 (3x)

🤝 Melhores duplas dentro da mesma linha
• L3: 11 + 13 — juntas 8x
• L1: 03 + 05 — juntas 7x
• L5: 25 + 21 — juntas 7x

📈 Distribuição alvo recomendada (soma 15)
L1=3, L2=3, L3=3, L4=3, L5=3

💡 Como montar seu palpite para o 3668

🎯 Núcleo de fixas por linha (1 forte de cada): **03, 09, 11, 20, 25**
   → top performer de cada eixo, garantem cobertura horizontal

➕ Apoio (2 por linha onde a média sobe): **05, 13, 21**
   → segundo melhor de L1, L3, L5 (linhas com média ≥ 3.0)

🎲 Coringas a girar: **07, 17**
   → reforço médio em L2 e L4

❌ Evitar nesta rodada: **06, 04, 19**
   → frequência ≤ 30% nas suas respectivas linhas

⚠️ Cuidado com a tentação de carregar uma única linha — em 10 sorteios, nenhuma linha passou de 4 dezenas em mais que 3 vezes.

Loteria envolve sorte. Use como guia, não como certeza.
```

O post de Colunas segue o mesmo formato, trocando "linha" por "coluna" e com faixas tipo C1=01,06,11,16,21.

## Arquivo afetado

**Apenas:** `supabase/functions/generate-guide-post/index.ts`

### 1. Substituir `detalharLinhasColunas()` por motor expandido

Nova função `analisarEixoDetalhado(concursos, eixo)` retorna:

- **`totalDezenasSorteadas`** = `concursos.length * 15`
- **`eixos`** — array de 5 itens, cada um com:
  - `indice` (1..5), `faixa` (string), `dezenasDoEixo` (5 dezenas)
  - `mediaPorSorteio` — média de dezenas daquele eixo por sorteio
  - `top2Distribuicao` — top 2 quantidades mais frequentes `{ qtd, vezes, perc }`
  - `fortes` — top 2 dezenas do eixo `{ dezena, vezes, perc }` (saíram mais)
  - `fracas` — top 2 dezenas do eixo com vezes ≤ 40% `{ dezena, vezes, perc }`
  - `melhorDupla` — `{ a, b, vezes }` da dupla de dezenas do mesmo eixo que mais coocorreu
- **`distribuicaoAlvo`** — vetor de 5 inteiros somando 15 (já existe via `ajustarPara15`)
- **`recomendacao`** — `{ nucleoFixas: number[], apoio: number[], coringas: number[], evitar: number[], alerta: string }`:
  - **nucleoFixas**: 1 dezena top de cada eixo (5 dezenas)
  - **apoio**: 2ª melhor de cada eixo cuja média ≥ 3.0
  - **coringas**: 2ª melhor dos eixos restantes
  - **evitar**: top 3 dezenas mais fracas globalmente (perc ≤ 30%)
  - **alerta**: texto sobre concentração máxima já vista (ex: "nenhuma linha passou de 4 dezenas em mais que 3x")

### 2. Reescrever `case "analise_linhas"` e `case "analise_colunas"` em `montarFatos()`

O `resumo` passa a montar **literalmente** os 7 blocos: panorama, distribuição média, fortes por eixo, fracas por eixo, melhores duplas, distribuição alvo, recomendação completa com núcleo/apoio/coringas/evitar + alerta.

O `recomendacaoDireta` resume em uma linha a ação clara.

### 3. Atualizar `montarPrompt()`

Adicionar `analise_linhas` e `analise_colunas` à lista de tipos que exigem **reprodução literal** dos blocos numéricos. A IA escreve apenas abertura (1 linha) e disclaimer.

### 4. Limite de caracteres

`analise_linhas` e `analise_colunas`: 1500 → **2200 caracteres**.

### 5. Validador

Já cobre 0–100 e dezenas via `c.dezenas`. Sem mudança.

### 6. Auditoria de coocorrência (lição aprendida)

Manter o padrão dos posts anteriores: para cada `melhorDupla` por eixo, recalcular por varredura independente e exigir match exato. Filtra duplas com vezes ≥ 3 e ambas dezenas do mesmo eixo.

### 7. Regeneração dos posts atuais

Migration SQL deletando os posts mais recentes de `analise_linhas` e `analise_colunas`, depois disparo de `generate-guide-post` para cada tipo.

## Garantias

- **Distribuição por eixo**: contagem absoluta nos últimos 10 sorteios. Determinística.
- **Fortes/fracas por eixo**: cada dezena do eixo conta presença real em `c.dezenas`.
- **Melhores duplas por eixo**: matriz de coocorrência restrita ao eixo + auditoria independente.
- **Distribuição alvo soma 15**: já garantida por `ajustarPara15`.
- **Recomendação núcleo/apoio/coringas/evitar**: regra fixa em código baseada em frequência por eixo.
- **Texto humanizado**: IA só escreve abertura e disclaimer; números, dezenas e justificativas vêm prontos do motor.
- **Anti-alucinação**: validador descarta qualquer número fora da whitelist; fallback publica o estudo completo se a IA falhar.

