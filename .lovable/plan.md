## Objetivo

Quando o sorteio da Mega-Sena entra no banco via `sync-megasena`, gerar automaticamente um post `tipo = 'resultado_oficial'` com `loteria_tag = 'Mega-Sena'`. A página `/home` (Comunidade) já tem a lógica de fixar o post `resultado_oficial` no topo — então o pin será automático para Mega-Sena assim que esses posts existirem.

## O que será feito

### 1. Edge Function `sync-megasena/index.ts`
Adicionar a função `criarPostResultadoOficialMega()` espelhando a da Lotofácil, adaptada para Mega-Sena:

- **Autor**: mesmo `AUGUSTO_PERFIL_ID` (`41b58d48-2ef1-4bf7-a536-ed8a49607fa9`).
- **Título determinístico** (sem IA): `🚨 Resultado Mega-Sena — Concurso {N}`.
- **Conteúdo**: chama Lovable AI Gateway (`google/gemini-3-flash-preview`) com system prompt focado em Mega-Sena. Validador anti-alucinação adaptado para 6 dezenas (1–60).
- **Fallback determinístico** se IA falhar ou validação rejeitar: monta texto com Pares/Ímpares, Moldura, Primos, Fibonacci, Repetidas, Soma, Sequências e flag de Acumulou.
- **Insert**: `postagens` com `loteria_tag = 'Mega-Sena'`, `tipo = 'resultado_oficial'`, `concurso_referencia`, `metadata` com indicadores e dezenas.
- **Idempotência**: antes de inserir, verifica se já existe post `resultado_oficial` para aquele concurso — se sim, pula.

### 2. Pontos de invocação dentro do `sync-megasena`
Hoje o arquivo só faz upsert e dispara push. Vamos chamar `criarPostResultadoOficialMega()`:

- Logo após `upsert` bem-sucedido, **apenas para o último concurso novo inserido** (quando `resultadosParaInserir.length === 1` ou para o de maior número), evitando flood histórico.
- Também aceitar query param `?force_post=true` que, mesmo sem novo concurso, gera o post para o concurso mais recente do banco caso ainda não exista (paridade com a Lotofácil).

### 3. Comunidade (`src/pages/Comunidade.tsx`)
**Nenhuma mudança necessária** — a lógica atual já fixa qualquer post com `tipo === 'resultado_oficial'` filtrado por `loteria_tag`. Quando o primeiro post de resultado da Mega-Sena for criado pela Edge Function, ele aparece fixado automaticamente.

Apenas remover (opcional) o estado vazio especial "Estudos de Mega-Sena em breve" se quiser, mas mantemos por enquanto como fallback de segurança caso o sync falhe.

### 4. Backfill imediato (1 chamada)
Após deploy da função atualizada, chamar `sync-megasena` com `?force_post=true` para gerar o post do concurso 3001 (já no banco), garantindo que a tela `/home` → Mega-Sena passe a ter o pin já no primeiro acesso.

## Arquivos afetados

- `supabase/functions/sync-megasena/index.ts` — adicionar gerador de post + invocação + suporte a `force_post`.

## Notas técnicas

- Validador anti-alucinação: whitelist com `[concurso, ...indicadores, ...dezenas]`. Dezenas no padrão `01–60` (zero-padded) só podem aparecer se estiverem entre as 6 oficiais.
- Custo IA: ~mesmas tokens da Lotofácil (~$0.0003 por post). Logado em `ai_usage_logs` com `edge_function: 'sync-megasena'`, `action_type: 'plantao_resultado_oficial'`.
- Não altera schema. Não altera RLS (tabela `postagens` já aceita inserts via service role).
