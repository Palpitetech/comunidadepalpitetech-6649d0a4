

## Dois novos posts: Posições Iniciais e Posições Finais

Encaixar **2 novos posts de análise** focados em **posicionamento das dezenas** dentro do volante ordenado, fechando a sequência diária às 15h.

### Nova agenda da manhã/tarde

| Horário | Post |
|---|---|
| 08:00 | analise_ciclo |
| 09:00 | analise_movimentacao (Quentes e Frias) |
| 10:00 | analise_moldura |
| 11:00 | analise_repetidas |
| 12:00 | analise_linhas |
| 13:00 | analise_colunas |
| **14:00** | **🆕 analise_posicoes_iniciais** (foco nas 3 primeiras dezenas) |
| **15:00** | **🆕 analise_posicoes_finais** (foco nas 3 últimas dezenas) |

## Conceito dos posts

Quando ordenamos as 15 dezenas sorteadas em ordem crescente, temos **posições fixas** (P1 a P15). Estatisticamente:
- **P1, P2, P3** quase sempre vêm da faixa baixa (01-08) — são o "início" do palpite
- **P13, P14, P15** quase sempre vêm da faixa alta (18-25) — são o "fim" do palpite

Os posts vão dar **direcionamento matemático** sobre quais dezenas tendem a ocupar cada uma dessas 6 posições no próximo concurso.

## Como vai ficar (exemplo Posições Iniciais)

```text
🎯 Posições Iniciais — Concurso 3668

Olá pessoal!

📊 O que diz a matemática (últimos 10 sorteios)
Quando ordenamos as 15 dezenas em ordem crescente, as 3 primeiras (P1, P2, P3)
quase nunca passam da dezena 10. Isso é tendência forte.

🎯 P1 — A primeira dezena (a menor do palpite)
Faixa real: entre 01 e 05 em 9 dos 10 sorteios (90%)
Top 3 candidatas: **01** (saiu 5x como P1), **02** (3x), **03** (2x)
Recomendação: começar o palpite em 01 ou 02.

🎯 P2 — A segunda dezena
Faixa real: entre 02 e 07 em 10 dos 10 sorteios (100%)
Top 3 candidatas: **03** (4x), **04** (3x), **05** (2x)
Recomendação: usar 03 ou 04 logo após a P1.

🎯 P3 — A terceira dezena
Faixa real: entre 04 e 09 em 9 dos 10 sorteios (90%)
Top 3 candidatas: **05** (3x), **06** (3x), **07** (2x)
Recomendação: a 3ª dezena costuma fechar a faixa baixa.

📈 Tendência observada
• Soma das 3 primeiras: média 9.4 (faixa 7 a 13)
• Distância P1→P3: média 5.2 dezenas
• Em 8 de 10 sorteios, pelo menos 1 das 3 primeiras saiu também no concurso anterior

💡 Como montar o INÍCIO do seu palpite para o 3668

🎯 Trio inicial recomendado: **01, 03, 06**
   → cada uma é a top candidata da sua posição

➕ Alternativas fortes: **02, 04, 07**
   → 2ª opção de cada posição se quiser variar

❌ Evite começar com: **08, 09, 10**
   → raramente aparecem entre as 3 primeiras (≤ 20%)

⚠️ Cuidado: começar com soma > 13 nas 3 primeiras quebra o padrão histórico (só ocorreu 1x em 10).

Loteria envolve sorte. Use como guia, não como certeza.
```

O post de **Posições Finais** segue o mesmo formato, mas para P13, P14, P15 (faixa alta 18-25), com soma das 3 últimas, distância P13→P15, e trio final recomendado.

## Arquivos afetados

### 1. `supabase/functions/generate-guide-post/index.ts`

**Novo motor `analisarPosicoesDetalhado(concursos, modo)`** onde `modo = "inicial" | "final"`:

- Para cada concurso, ordenar as 15 dezenas crescente.
- Se `modo = "inicial"`: pegar índices [0, 1, 2] → P1, P2, P3.
- Se `modo = "final"`: pegar índices [12, 13, 14] → P13, P14, P15.

Retorna:
- **`posicoes`** — 3 objetos `{ rotulo: "P1"|"P2"|"P3" (ou P13/P14/P15), faixaMin, faixaMax, percFaixa, top3: [{ dezena, vezes, perc }] }`
- **`somaMedia`**, **`somaMin`**, **`somaMax`** — estatísticas da soma do trio
- **`distanciaMedia`** — média de (P3 − P1) ou (P15 − P13)
- **`coocorrenciaUltimo`** — em quantos sorteios pelo menos 1 das 3 posições repetiu do anterior
- **`recomendacao`** — `{ trioRecomendado: [d1,d2,d3], alternativas: [d1,d2,d3], evitar: number[], alerta: string }`
  - **trioRecomendado**: top 1 de cada posição (com auditoria de não repetir dezena entre P1/P2/P3)
  - **alternativas**: 2ª opção de cada posição
  - **evitar**: top 3 dezenas que raramente aparecem nessas posições (perc ≤ 20%) na faixa relevante (1-10 ou 16-25)
  - **alerta**: regra de soma observada nos últimos 10

**Novos cases em `montarFatos()`**: `analise_posicoes_iniciais` e `analise_posicoes_finais` que chamam o motor com o modo certo e montam o resumo literal de 5 blocos (panorama, 3 cards de posição, tendência, recomendação).

**Atualizar `montarTituloDeterministico()`**:
- `analise_posicoes_iniciais`: `🎯 Posições Iniciais — Concurso N`
- `analise_posicoes_finais`: `🏁 Posições Finais — Concurso N`

**Atualizar `montarPrompt()`**:
- Adicionar entradas em `titulos`.
- Adicionar instrução de **reprodução literal** dos blocos para os 2 novos tipos.
- Limite de caracteres: **2200**.

**Validador**: já cobre 0–100 (faixas, percentuais e dezenas 01-25). Sem mudança.

### 2. Migration SQL

Inserir 2 novos schedules ativos para todos os dias:

```sql
INSERT INTO public.post_schedules (tipo_post, horario, dias, ativo, loteria) VALUES
  ('analise_posicoes_iniciais', '14:00', '{0,1,2,3,4,5,6}', true, 'lotofacil'),
  ('analise_posicoes_finais',   '15:00', '{0,1,2,3,4,5,6}', true, 'lotofacil');
```

### 3. Disparo manual de teste

Após deploy, chamar `generate-guide-post` para cada um dos 2 novos tipos para gerar a 1ª versão imediatamente e validar.

## Garantias

- **Posições reais**: ordenação crescente das dezenas em cada concurso — determinístico.
- **Top candidatas por posição**: contagem absoluta nos últimos 10 sorteios.
- **Trio recomendado sem colisão**: validação garante 3 dezenas distintas.
- **Faixas de soma e distância**: calculadas direto dos dados, nunca inventadas.
- **Texto humanizado**: IA só escreve abertura e disclaimer; números e dezenas vêm prontos do motor.
- **Anti-alucinação**: validador descarta números fora da whitelist; fallback publica o estudo completo se a IA falhar.
- **Encaixe na agenda**: 14h e 15h estão livres, 15h vira o último post de análise do dia.

