

## Refator dos Posts Automáticos — IA + Segurança Total

Mantém a IA gerando texto (criatividade preservada), mas trava o pipeline com camadas de segurança contra falhas, conteúdo inválido e duplicação.

## Agenda final (Especialista Lotofácil)

| Hora BRT | Tipo de post | Tema |
|---|---|---|
| 08:00 | `analise_ciclo` | Status do ciclo + dezenas faltantes |
| 09:00 | `analise_movimentacao` | Quentes/Frias + Fixas/Excluídas |
| 10:00 | `analise_moldura` | Dezenas e quantidade ideal de moldura |
| 11:00 | `analise_repetidas` | Quais repetir e quantas |
| 12:00 | `analise_linhas` | Comportamento + montagem por linha |
| 13:00 | `analise_colunas` | Comportamento + montagem por coluna |
| 23:00 | `resultado_oficial` | Disparo automático via `sync-lotofacil` |

Todos os dias da semana (`dias: [0,1,2,3,4,5,6]`).

## O que muda

### 1. Refatorar `generate-guide-post/index.ts` (1 arquivo)

**Novos cálculos** (puros, sem IA — alimentam o prompt):
- `calcularDistribuicaoLinhas(concursos)` → média de dezenas por linha L1–L5 nos últimos 10
- `calcularDistribuicaoColunas(concursos)` → média por coluna C1–C5
- `calcularQuentesFriasTop(concursos, 10)` → recomendações diretas de Fixar/Excluir
- `calcularRepetidasRecomendadas(concursos, 10)` → quais repetir + quantidade média
- `calcularMolduraRecomendada(concursos, 10)` → dezenas + quantidade ideal

**Janela de análise reduzida para 10 concursos** (era 20) — alinhado ao pedido.

**Novos `tipoPost` aceitos:** `analise_linhas`, `analise_colunas` (os outros 4 já existem).

**Camada de segurança (NOVA):**
1. **Retry com backoff** na chamada Lovable AI (3 tentativas, 1s/2s/4s) — cobre 429/timeouts
2. **Fallback por status:** 402 → log + retorna 200 com `skipped: payment_required`; 429 → mesma resposta
3. **Validação rígida do JSON da IA:**
   - Schema fixo `{titulo: string ≤100, conteudo: string ≤1000}`
   - Se falhar parse: 1 retentativa com prompt corrigido; se falhar de novo, **gera post fallback determinístico** (template TS preenchido com os números calculados — não posta lixo nem deixa de postar)
4. **Sanitização de conteúdo:** remove menções a "IA", "bot", "modelo", "GPT", "Gemini" (regex case-insensitive) antes de salvar
5. **Validação de números no texto:** confirma que dezenas citadas no texto pertencem ao conjunto 1–25 (descarta inválidas via regex)
6. **Lock de duplicação reforçado:** além dos 30min em `process-scheduled-posts`, checa em `generate-guide-post` por `(user_id, tipo, created_at >= hoje 00h BRT)` — impede 2 posts do mesmo tipo no mesmo dia

**Logs auditáveis:**
- Toda execução grava em `bot_publishing_logs` com `event_type` (success/error/fallback/skipped) e detalhes
- Tokens/custo continuam em `ai_usage_logs`

### 2. Atualizar agenda do bot (1 UPDATE SQL)

```sql
UPDATE guide_personas
SET post_schedule = '{
  "dias": [0,1,2,3,4,5,6],
  "horarios": ["08:00","09:00","10:00","11:00","12:00","13:00","23:00"],
  "tipo_por_horario": {
    "08:00": "analise_ciclo",
    "09:00": "analise_movimentacao",
    "10:00": "analise_moldura",
    "11:00": "analise_repetidas",
    "12:00": "analise_linhas",
    "13:00": "analise_colunas",
    "23:00": "resultado_oficial"
  }
}'::jsonb
WHERE id = '7625b931-48dc-4550-81f3-1f8bd8a0ce33';
```

### 3. Ajuste fino no `process-scheduled-posts` (mínimo)

- Pular o slot `23:00` da agenda (resultado já é disparado pelo `sync-lotofacil`, evitar dupla execução)
- Manter resto inalterado

## Diretrizes do prompt para garantir variedade (anti-robotização)

Cada tipo recebe:
- **Os números reais** calculados em TS (fixos, verdadeiros)
- **Liberdade de escrita** para a IA (tom, ordem, ganchos diferentes)
- **Estrutura mínima obrigatória:** `📊 O que aconteceu nos últimos 10` + `💡 Como montar seu palpite` + disclaimer
- **Temperatura moderada** (0.8) no Gemini para variar redação dia a dia
- **Modelo:** mantém `google/gemini-3-flash-preview` (rápido, barato, bom o suficiente)

## Fluxo completo (com proteções)

```text
cron (por minuto)
  ↓
process-scheduled-posts
  ├── checa horário+dia+tipo
  ├── checa duplicação 30min
  ↓
generate-guide-post (refatorada)
  ├── busca últimos 10 concursos
  ├── calcula 6 indicadores em TS (dados verdadeiros)
  ├── monta prompt específico do tipo + dados
  ├── chama Lovable AI (retry 3x)
  │     ├── 200 OK → valida JSON
  │     │     ├── válido → sanitiza → posta
  │     │     └── inválido → fallback determinístico → posta
  │     ├── 429/402 → log skip, sai limpo
  │     └── 5xx → retry; falhou tudo → fallback determinístico
  ├── checa duplicação por tipo+dia (lock final)
  ├── insere em postagens
  └── log em bot_publishing_logs + ai_usage_logs
```

## O que NÃO faço

- Não mexo em `sync-lotofacil` (post das 23h continua igual)
- Não toco em outros bots (Mega/Dupla seguem desativados)
- Não removo a IA — ela continua gerando o texto criativo
- Não altero schema do banco (só UPDATE em 1 linha de `guide_personas`)
- Não crio nova edge function (refator concentrado no `generate-guide-post` existente)

## Arquivos modificados

1. `supabase/functions/generate-guide-post/index.ts` — refator completo (cálculos novos + camada de segurança + 2 novos tipos)
2. `supabase/functions/process-scheduled-posts/index.ts` — pular slot 23:00
3. 1 migration SQL — atualizar `post_schedule`

## Verificação após aplicar

1. `curl` em cada um dos 6 tipos para confirmar geração + sanitização
2. Forçar erro 500 simulado para validar fallback determinístico
3. Aguardar próximo horário cruzar e ver post real publicado
4. Conferir `bot_publishing_logs` registrando cada execução

