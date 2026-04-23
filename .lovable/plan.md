

## Enriquecer o Post de Moldura com estudo profundo

Transformar o post de moldura num **estudo real**: mostrar quantos concursos cada dezena top apareceu, quais formaram **pares e trios mais fortes**, quais foram as **dezenas fracas** da moldura (e com quem saíram), o **padrão de falha** e justificar **dezena por dezena** na recomendação.

## Como vai ficar o post

```text
🖼️ Análise de Moldura — Concurso 3668

Olá pessoal!

📊 Panorama da Moldura (últimos 10 sorteios)
A moldura tem 16 dezenas (01-05, 06, 10, 11, 15, 16, 20, 21-25).
Média de moldura por concurso: 9.4 dezenas.
Faixa mais comum: 9 a 10 dezenas (70% dos sorteios).

🔥 Top dezenas fortes da moldura
• 25 — saiu em 9 dos 10 concursos (90%)
• 21 — saiu em 8 dos 10 concursos (80%)
• 03 — saiu em 8 dos 10 concursos (80%)
• 11 — saiu em 7 dos 10 concursos (70%)
• 16 — saiu em 7 dos 10 concursos (70%)
• 05 — saiu em 6 dos 10 concursos (60%)

🤝 Melhores pares (saíram juntos com mais frequência)
• 25 + 21 — juntas 7x
• 25 + 03 — juntas 7x
• 21 + 11 — juntas 6x

🎯 Melhores trios
• 25 + 21 + 03 — juntos 6x
• 25 + 11 + 16 — juntos 5x

❄️ Dezenas fracas da moldura (atenção)
• 06 — saiu apenas 2x (20%)  → quando saiu, veio com 25 e 11
• 22 — saiu apenas 3x (30%)  → quando saiu, veio com 21 e 03
• 10 — saiu apenas 3x (30%)  → quando saiu, veio com 16 e 05

📉 Padrão de falha
Quando a moldura veio fraca (≤8 dezenas), aconteceu em 2 dos 10 concursos.
Nesses casos, as ausentes foram principalmente: 06, 22, 10, 20.

💡 Como montar seu palpite para o 3668
Recomendamos usar 9 dezenas da moldura, distribuídas assim:

🎯 Núcleo forte (4 fixas): **25, 21, 03, 11**
   → top frequência (70%+) e formam pares/trios consistentes

➕ Apoio (3 dezenas): **16, 05, 23**
   → frequência média (60-70%), reforçam a estrutura

🎲 Coringas (2 dezenas a girar): **15, 20**
   → atrasadas no momento, com tendência de retorno

❌ Deixe de fora desta rodada: **06, 22, 10**
   → padrão fraco recente, baixa coocorrência com o núcleo

Loteria envolve sorte. Use como guia, não como certeza.
```

## Arquivo afetado

**Apenas:** `supabase/functions/generate-guide-post/index.ts`

### 1. Substituir `calcularMolduraRecomendada()` por motor expandido

Nova função `analisarMolduraDetalhado(concursos)` retorna:
- **`mediaMoldura`** (já existe)
- **`faixaMaisComum`** — distribuição de quantidade de dezenas da moldura por concurso (top 2 faixas + %)
- **`fortes`** — array das dezenas da moldura com `{ dezena, vezes, perc }` ordenadas desc, top 8
- **`fracas`** — dezenas da moldura com `{ dezena, vezes, perc, companheirasFrequentes: number[] }` (até 3 dezenas que mais saíram junto), filtradas com vezes ≤ 30% dos concursos
- **`melhoresPares`** — top 3 pares de dezenas da moldura que mais coocorreram (calculado por matriz de coocorrência)
- **`melhoresTrios`** — top 2 trios da moldura que mais coocorreram
- **`padraoFalha`** — quantos concursos tiveram moldura ≤ (média - 1) e quais dezenas faltaram nesses concursos (top 4 ausentes)
- **`recomendacao`** — objeto com `{ qtdRecomendada, nucleoForte: number[], apoio: number[], coringas: number[], deixarFora: number[] }` + justificativa textual por grupo

### 2. Atualizar `case "analise_moldura"` em `montarFatos()`

O `resumo` passa a montar **literalmente** os 6 blocos do post (panorama, fortes, pares, trios, fracas, padrão de falha). O `recomendacaoDireta` monta o bloco "Como montar seu palpite" com **núcleo forte / apoio / coringas / deixar de fora** já com justificativa por grupo.

### 3. Atualizar `montarPrompt()`

Adicionar `analise_moldura` à lista de tipos que exigem **reprodução literal** dos blocos numéricos. A IA só escreve a abertura (1 linha) e o disclaimer final.

### 4. Atualizar validador

Whitelist já cobre 0–100. Liberar também os números das dezenas da moldura (já estão em `permitidos` via `c.dezenas`). Adicionar percentuais de coocorrência (já cobertos por 0–100). Sem mudanças extras.

### 5. Limite de caracteres

Aumentar para `analise_moldura` o limite de 1500 → **2000 caracteres** (post mais rico).

### 6. Fallback

Como o fallback usa `fatos.resumo + fatos.recomendacaoDireta` direto, ambos já vão vir completos com o novo formato. Sem mudança extra.

## Garantias

- **Coocorrências (pares/trios)**: matriz determinística calculada em TypeScript — sempre real.
- **Companheiras das dezenas fracas**: cruzamento de presença nos mesmos concursos onde a fraca apareceu.
- **Padrão de falha**: filtro de concursos abaixo da média + contagem de ausentes.
- **Justificativa por grupo (núcleo/apoio/coringas/fora)**: classificação automática por faixa de frequência.
- **Texto humanizado**: IA só escreve abertura e disclaimer; números, dezenas e justificativas vêm prontos do motor.
- **Anti-alucinação**: validador descarta qualquer número fora da whitelist; fallback publica o estudo completo se a IA falhar.

