

## Enriquecer o Post de Ciclo com dados históricos

Trazer o **status real do ciclo atual** + a **distribuição histórica de duração** + **justificativa explícita** das dezenas escolhidas/excluídas.

## Como vai ficar o post

```text
🔄 Ciclo da Lotofácil — Concurso 3668

Olá pessoal!

📊 Onde estamos
Estamos no Ciclo 45, atualmente com 2 concursos jogados (3666 e 3667).
O próximo sorteio (3668) será o 3º concurso deste ciclo.
Faltam 13 dezenas para fechar: 03, 06, 08, 09, 10, 12, 14, 16, 17, 19, 20, 22, 25.

📈 Histórico (últimos 44 ciclos fechados)
• 2 concursos: 4 vezes (9%)
• 3 concursos: 14 vezes (32%)
• 4 concursos: 11 vezes (25%)
• 5 concursos: 6 vezes (14%)
• 6+ concursos: 9 vezes (20%)
Mais comum: ciclo fecha em 3 ou 4 concursos (57% dos casos).

💡 Como montar seu palpite para o 3668
Como ainda estamos cedo no ciclo (3º concurso), a chance de fechamento agora é baixa
(somente 9% dos ciclos fecharam tão rápido).
👉 Recomendação: NÃO aposte tudo nas faltantes ainda. Use 6 a 8 dezenas faltantes
prioritárias e complete com quentes.

🎯 Faltantes prioritárias (6): 03, 09, 12, 17, 20, 25
   → escolhidas porque saíram menos vezes nos últimos 10 sorteios
❌ Deixadas de fora desta rodada: 06, 08, 10, 14, 16, 19, 22
   → ainda há tempo no ciclo, dá pra incluí-las nos próximos concursos

Loteria envolve sorte. Use como guia, não como certeza.
```

Quando o ciclo estiver perto de fechar (ex.: 4º ou 5º concurso já dentro da faixa mais comum), a recomendação inverte automaticamente para **"aposte forte no fechamento"**.

## Arquivo afetado

**Apenas:** `supabase/functions/generate-guide-post/index.ts`

### 1. Buscar histórico completo de ciclos no handler

Hoje a função busca só os últimos 10 concursos. Vamos adicionar uma segunda query (paralela) que retorna a duração de **todos os ciclos já fechados**:

```sql
SELECT ciclo_numero, COUNT(*) AS duracao
FROM resultados_loterias
WHERE loteria='lotofacil' AND ciclo_numero IS NOT NULL
GROUP BY ciclo_numero
```

Esse array é passado para `montarFatos()` como parâmetro extra **só** para `analise_ciclo`.

### 2. Novo motor determinístico

Adicionar 2 funções:

- **`calcularEstatisticasCiclo(historicoCiclos)`** — recebe todos os ciclos, exclui o ciclo atual (em andamento) e retorna:
  - distribuição: `{2: 4, 3: 14, 4: 11, 5: 6, 6: 5, 7: 3, 8: 1, ...}`
  - percentuais
  - faixa mais comum (top 2 durações somadas)
  - total de ciclos analisados

- **`montarRecomendacaoCiclo(posicaoNoCiclo, estatisticas, faltantes, quentes)`** — decide:
  - Se posição atual ≤ percentil 25 das durações → "ainda é cedo, NÃO aposte fechamento"
  - Se posição atual ∈ faixa mais comum → "alta chance de fechar agora, aposte fechamento"
  - Se posição atual > percentil 75 → "ciclo demorando, ainda dá pra entrar"
  - Escolhe N faltantes priorizando as **mais quentes na janela de 10 sorteios** (justificativa: "saíram mais vezes recentemente")
  - Lista as faltantes deixadas de fora com justificativa ("ainda há tempo no ciclo")

### 3. Atualizar `case "analise_ciclo"` em `montarFatos()`

O `resumo` passa a incluir os 4 blocos: status atual, posição no próximo concurso, histórico de durações com %, e justificativa por dezena.

### 4. Atualizar `montarPrompt()`

Instrução adicional para `analise_ciclo`: reproduzir os blocos "📈 Histórico", "🎯 Faltantes prioritárias" e "❌ Deixadas de fora" **literalmente**, sem resumir.

### 5. Atualizar validador

A whitelist já permite 0–80 (cobre contagens, percentuais e número de concursos). Adicionar `permitidos.add(totalCiclos)` para liberar o número total de ciclos analisados (ex.: 44).

### 6. Atualizar `fallbackConteudo()`

Como o fallback hoje é genérico (usa `fatos.resumo` direto), e o novo `resumo` já vem completo, o fallback já vai render correto sem mudança extra.

## Garantias

- **Posição no ciclo**: calculada por `COUNT(concursos onde ciclo_numero = atual) + 1`. Determinística.
- **Histórico de durações**: vem de `GROUP BY ciclo_numero` — sempre real.
- **Justificativa das dezenas**: cruzamento entre `faltantes` e `topQuentes(10)` — explicação automática.
- **Recomendação fechamento sim/não**: regra fixa em código baseada em percentis da distribuição histórica.
- **Texto humanizado**: IA só escreve abertura e transições. Números e justificativas vêm prontos.

