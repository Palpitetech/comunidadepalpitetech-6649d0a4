

## Enriquecer o Post de Quentes e Frias com estudo profundo

Transformar o post mais esperado da comunidade num **estudo completo de tendência**: mostrar quantos concursos cada quente/fria saiu, **melhores duplas e trios entre as quentes**, **piores duplas entre as frias**, **ranking de aceleração/desaceleração** (quem está esquentando ou esfriando) e **justificativa clara** para fixar e excluir no próximo concurso.

## Como vai ficar o post

```text
🔥❄️ Quentes e Frias da Lotofácil — Concurso 3668

Olá pessoal!

📊 O que aconteceu nos últimos 10 concursos
Sorteamos 150 dezenas no total (15 por concurso).
Em cima disso, identificamos um padrão claro de força e fraqueza.

🔥 Dezenas QUENTES (saíram em 80%+ dos concursos)
• 03 — saiu em 10 dos 10 concursos (100%)  → força total
• 11 — saiu em 10 dos 10 concursos (100%)  → força total
• 25 — saiu em 9 dos 10 concursos (90%)
• 21 — saiu em 9 dos 10 concursos (90%)
• 13 — saiu em 8 dos 10 concursos (80%)
• 17 — saiu em 8 dos 10 concursos (80%)

🤝 Top duplas entre as quentes (saíram juntas)
• 03 + 11 — juntas 10x (sempre que uma saiu, a outra também)
• 03 + 25 — juntas 9x
• 11 + 21 — juntas 9x

🎯 Top trios entre as quentes
• 03 + 11 + 25 — juntos 9x
• 03 + 11 + 21 — juntos 9x

❄️ Dezenas FRIAS (saíram em 30% ou menos)
• 06 — saiu em 2 dos 10 concursos (20%)
• 19 — saiu em 3 dos 10 concursos (30%)
• 22 — saiu em 3 dos 10 concursos (30%)

🚫 Piores duplas entre as frias (quase nunca juntas)
• 06 + 19 — saíram juntas só 1x em 10
• 06 + 22 — saíram juntas só 1x em 10

📈 Acelerando (esquentando nos últimos 5 concursos)
• 13 — saiu 5x nos últimos 5 (era 3x nos 5 anteriores) ↑
• 17 — saiu 4x nos últimos 5 (era 4x nos 5 anteriores) →
• 09 — saiu 4x nos últimos 5 (era 2x nos 5 anteriores) ↑

📉 Desacelerando (esfriando nos últimos 5 concursos)
• 25 — saiu 4x nos últimos 5 (era 5x nos 5 anteriores) ↓
• 14 — saiu 2x nos últimos 5 (era 4x nos 5 anteriores) ↓

💡 Recomendação para o concurso 3668

🎯 FIXAR (5 dezenas com força máxima): **03, 11, 25, 21, 13**
   → todas com 80%+ de presença E formando os top pares/trios

➕ APOIO forte (3 dezenas): **17, 09, 23**
   → presença alta + tendência de aceleração nos últimos 5

❌ EXCLUIR desta rodada: **06, 19, 22**
   → frequência ≤30% E quase não saem juntas (dupla 06+19 só 1x em 10)

⚠️ Ficar de olho: **25 e 14** estão desacelerando — podem cair fora em breve.

Loteria envolve sorte. Use como guia, não como certeza.
```

## Arquivo afetado

**Apenas:** `supabase/functions/generate-guide-post/index.ts`

### 1. Substituir lógica simples de `analise_movimentacao` por motor expandido

Nova função `analisarQuentesFriasDetalhado(concursos)` que retorna:

- **`quentes`** — array `{ dezena, vezes, perc }` para dezenas com presença ≥ 80%, top 8
- **`frias`** — array `{ dezena, vezes, perc }` para dezenas com presença ≤ 30%, top 6
- **`topParesQuentes`** — top 3 pares de dezenas quentes que mais saíram juntos (matriz de coocorrência restrita às quentes)
- **`topTriosQuentes`** — top 2 trios de dezenas quentes que mais saíram juntos
- **`pioresParesFrias`** — top 2 pares de dezenas frias que menos saíram juntas (mas pelo menos uma vez juntas, para ter dado real)
- **`acelerando`** — dezenas que saíram MAIS nos últimos 5 do que nos 5 anteriores: `{ dezena, recente, anterior, delta }`, top 3 com delta > 0
- **`desacelerando`** — dezenas que saíram MENOS nos últimos 5 do que nos 5 anteriores, top 2 com delta < 0
- **`recomendacao`** — `{ fixar: number[], apoio: number[], excluir: number[], ficarDeOlho: number[] }` calculado por:
  - **fixar**: top 5 quentes que aparecem em pelo menos 1 dos top pares/trios
  - **apoio**: 3 dezenas com presença ≥ 60% E que estejam no `acelerando` (ou top frequência se faltar)
  - **excluir**: até 3 dezenas frias que tenham par fraco entre si
  - **ficarDeOlho**: dezenas em `desacelerando` que ainda estão nas quentes (alerta de queda iminente)

### 2. Atualizar `case "analise_movimentacao"` em `montarFatos()`

O `resumo` passa a montar **literalmente** os blocos: panorama, quentes, top pares quentes, top trios quentes, frias, piores pares frias, acelerando, desacelerando.

O `recomendacaoDireta` monta o bloco "Recomendação para o concurso" com **fixar / apoio / excluir / ficar de olho**, cada grupo com justificativa textual baseada na regra que selecionou aquela dezena.

### 3. Atualizar `montarPrompt()`

Adicionar `analise_movimentacao` à lista de tipos que exigem **reprodução literal** dos blocos numéricos. A IA só escreve a abertura (1 linha de boas-vindas) e o disclaimer final.

### 4. Atualizar limite de caracteres

`analise_movimentacao`: 1500 → **2200 caracteres** (post mais rico, com 8 blocos de dados + recomendação).

### 5. Validador

Whitelist atual já cobre 0–100 (percentuais e contagens). Os números de dezenas (1–25) já entram via `permitidos = new Set(c.dezenas)`. Sem mudanças extras.

### 6. Fallback

Como o fallback usa `fatos.resumo + fatos.recomendacaoDireta` direto, ambos já vão vir completos com o novo formato. Sem mudança extra.

### 7. Regeneração do post atual

Migration SQL para deletar o post de `analise_movimentacao` do concurso 3668, depois disparo da edge function `generate-guide-post` com `tipo_post: "analise_movimentacao"` para regenerar com o novo formato.

## Garantias

- **Quentes/frias com contagem absoluta**: vem de `concursos.filter(c => c.dezenas.includes(d)).length`. Determinístico.
- **Top duplas/trios entre quentes**: matriz de coocorrência restrita ao subconjunto de quentes — sempre real.
- **Piores duplas entre frias**: cruzamento de presença nos mesmos concursos das frias.
- **Aceleração/desaceleração**: comparação `concursos[0..4]` vs `concursos[5..9]` — janela móvel real.
- **Recomendação fixar/excluir**: regra fixa em código que cruza frequência + coocorrência + tendência.
- **Texto humanizado**: IA só escreve abertura e disclaimer; números, dezenas e justificativas vêm prontos do motor.
- **Anti-alucinação**: validador descarta qualquer número fora da whitelist; fallback publica o estudo completo se a IA falhar.

