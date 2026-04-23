

## Enriquecer o Post de Repetidas com estudo profundo

Transformar o post de repetidas num **estudo completo de movimentação dezena-a-dezena entre sorteios**: mostrar quantas dezenas se repetiram concurso a concurso, quais dezenas mais se repetiram (as "fiéis"), quais raramente se repetem (as "voláteis"), as **melhores duplas/trios de repetidoras** que tendem a vir juntas no próximo sorteio, e uma **recomendação direta** de quantas e quais repetidas usar no próximo palpite.

## Como vai ficar o post

```text
🔁 Análise de Repetidas — Concurso 3668

Olá pessoal!

📊 O que aconteceu nos últimos 10 concursos
A cada sorteio, em média 9.1 dezenas se repetem do concurso anterior.
Faixa mais comum: entre 8 e 10 repetidas (70% dos sorteios).
Mínimo recente: 7 repetidas | Máximo recente: 11 repetidas.

🎯 No último sorteio (3667)
Dezenas: 02, 03, 05, 06, 07, 09, 11, 14, 15, 18, 19, 20, 22, 23, 25
São essas que vão competir para se repetir no 3668.

🔥 Destaques — as MAIS FIÉIS (mais se repetiram nos últimos 9 ciclos)
• 23 — repetiu 8 das 9 vezes possíveis (89%)
• 11 — repetiu 7 das 9 (78%)
• 03 — repetiu 7 das 9 (78%)
• 05 — repetiu 6 das 9 (67%)
• 25 — repetiu 6 das 9 (67%)

⚠️ Atenção — as VOLÁTEIS do último sorteio (raramente repetem)
• 14 — repetiu só 2 das 9 (22%)  → tende a sair do próximo
• 22 — repetiu só 3 das 9 (33%)
• 18 — repetiu só 3 das 9 (33%)

🤝 Melhores duplas de repetidoras (quando uma repete, a outra também)
• 23 + 11 — repetiram juntas 7x em 9
• 23 + 03 — repetiram juntas 6x em 9
• 11 + 25 — repetiram juntas 5x em 9

🎯 Melhores trios de repetidoras
• 23 + 11 + 03 — repetiram juntos 6x em 9
• 23 + 11 + 25 — repetiram juntos 5x em 9

💡 Como montar seu palpite para o 3668
Histórico aponta para usar 9 dezenas REPETIDAS do último sorteio:

🎯 REPETIR (núcleo de 5 fixas): **23, 11, 03, 05, 25**
   → as mais fiéis (67%+) e formam as top duplas/trios

➕ REPETIR (apoio de 4): **02, 06, 07, 09**
   → frequência de repetição média-alta, reforçam o núcleo

❌ NÃO repetir desta rodada: **14, 22, 18**
   → voláteis, padrão histórico de sair fora no próximo

✨ E completar com 6 dezenas NOVAS (que não saíram no 3667).

Loteria envolve sorte. Use como guia, não como certeza.
```

## Arquivo afetado

**Apenas:** `supabase/functions/generate-guide-post/index.ts`

### 1. Substituir `calcularRepetidasRecomendadas()` por motor expandido

Nova função `analisarRepetidasDetalhado(concursos)` retorna:

- **`totalConcursos`** — N
- **`paresAnalisados`** — N-1 (transições entre concursos consecutivos)
- **`mediaRepetidas`** — média de dezenas repetidas por transição
- **`faixaMaisComum`** — `{ min, max, perc }` das 2 quantidades de repetição mais frequentes
- **`minRepetidas`**, **`maxRepetidas`** — extremos observados
- **`ultimoSorteio`** — array das 15 dezenas do concurso mais recente
- **`fieis`** — top 5 dezenas que MAIS se repetiram entre concursos consecutivos: `{ dezena, vezes, transicoes, perc }` — restrito às que estão no último sorteio (são as candidatas reais a repetir)
- **`volateis`** — dezenas do **último sorteio** com baixa taxa histórica de repetição: `{ dezena, vezes, transicoes, perc }`, top 3 com perc ≤ 35%
- **`melhoresDuplasRep`** — top 3 pares de dezenas que MAIS se repetiram juntas entre concursos consecutivos (matriz de coocorrência de repetição), restritas ao último sorteio
- **`melhoresTriosRep`** — top 2 trios análogos
- **`recomendacao`** — `{ qtdRecomendada, repetirNucleo: number[], repetirApoio: number[], naoRepetir: number[], qtdNovas: number, justNucleo, justApoio, justNaoRepetir }`
  - **qtdRecomendada** = `Math.round(mediaRepetidas)` (entre 7 e 11)
  - **repetirNucleo**: 5 dezenas com perc≥60% que estão nos top duplas/trios
  - **repetirApoio**: até 4 dezenas com perc 40-60% completando até `qtdRecomendada`
  - **naoRepetir**: até 3 voláteis (perc ≤ 35%)
  - **qtdNovas** = `15 - qtdRecomendada`

### 2. Atualizar `case "analise_repetidas"` em `montarFatos()`

O `resumo` passa a montar **literalmente** os 7 blocos do post (panorama, último sorteio, fiéis, voláteis, melhores duplas, melhores trios, recomendação completa com núcleo/apoio/não-repetir + dezenas novas). O `recomendacaoDireta` resume a ação clara.

### 3. Atualizar `montarPrompt()`

Adicionar `analise_repetidas` à lista de tipos que exigem **reprodução literal** dos blocos numéricos. A IA só escreve a abertura (1 linha) e o disclaimer final.

### 4. Atualizar limite de caracteres

`analise_repetidas`: 1500 → **2200 caracteres** (post mais rico, com 7 blocos + recomendação detalhada).

### 5. Validador

Whitelist atual já cobre 0–100 (percentuais e contagens). As dezenas (1–25) já entram via `permitidos = new Set(c.dezenas)`. Sem mudanças extras.

### 6. Fallback

Como o fallback usa `fatos.resumo + fatos.recomendacaoDireta` direto, ambos já vão vir completos com o novo formato. Sem mudança extra.

### 7. Regeneração do post atual

Migration SQL para deletar o post de `analise_repetidas` mais recente, depois disparo da edge function `generate-guide-post` com `tipo_post: "analise_repetidas"` para regenerar com o novo formato.

## Garantias

- **Taxa de repetição por dezena**: para cada par (concurso[i], concurso[i+1]), conta quantas dezenas repetiram. Determinístico.
- **Fiéis e voláteis restritos ao último sorteio**: só faz sentido recomendar repetir o que está disponível para repetir.
- **Top duplas/trios de repetição**: matriz de coocorrência de repetição entre concursos consecutivos — sempre real.
- **Recomendação núcleo/apoio/não-repetir**: regra fixa em código que cruza taxa de repetição + coocorrência.
- **Texto humanizado**: IA só escreve abertura e disclaimer; números, dezenas e justificativas vêm prontos do motor.
- **Anti-alucinação**: validador descarta qualquer número fora da whitelist; fallback publica o estudo completo se a IA falhar.

