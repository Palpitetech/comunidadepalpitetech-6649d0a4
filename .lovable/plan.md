

## Centralizar todas as postagens no Palpite Tech

### Problema atual

Hoje **2 bots** postam na comunidade:

| Bot | Posts/dia | Como |
|---|---|---|
| **Palpite Tech** | 6 (1 resultado + 5 análises) | `sync-lotofacil` + `generate-guide-post` |
| **Especialista Lotofácil** | 1 (às 13:29, tipo "estrategia") | `generate-guide-post` via cron |

E `generate-roundtable-post` ainda existe no código mas **não é chamada por nada** desde 08/abr (código morto).

### O que vou fazer

#### 1. Mover o post de "estratégia" do Especialista Lotofácil para o Palpite Tech

Adiciono **`13:30 → estrategia`** ao `post_schedule.tipo_por_horario` do Palpite Tech. O cron continua igual, o conteúdo continua igual (mesmo prompt de estratégia já existe em `montarInstrucoesTipo`), só o autor muda.

```sql
-- Antes (Palpite Tech)
horarios: ["09:00","10:00","11:00","14:00","16:00"]
tipo_por_horario: { "09:00":"analise_ciclo", ... "16:00":"analise_moldura" }

-- Depois
horarios: ["09:00","10:00","11:00","13:30","14:00","16:00"]
tipo_por_horario: { ..., "13:30":"estrategia", ... }
```

Especialista Lotofácil fica **só com chat** (`can_create_posts = false`, mantém `chat_enabled = true`).

#### 2. Remover `is_strategy_author`, `is_sales_author`, `is_system_sales_author` do Palpite Tech... espera

Não — Palpite Tech precisa só de `is_result_author = true` (já tem). O `tipo_por_horario` resolve sozinho qual prompt usar. Os outros flags ficam neutros.

#### 3. Garantir trava no `generate-guide-post`

A função hoje aceita qualquer `guide_persona_id` ativo com `can_create_posts`. Como só o Palpite Tech terá esse flag, naturalmente fica restrito. Mas adiciono **defesa em profundidade**: no início, valida que o guia selecionado tem `is_result_author = true` OU `id = palpite_tech_id`. Se outro bot tentar (cron antigo, chamada manual), retorna 403 com log.

#### 4. Deletar código morto

| Arquivo | Por quê |
|---|---|
| `supabase/functions/generate-roundtable-post/` | Não é chamada por ninguém há 12 dias. Sub-bots comentaristas não existem mais |

#### 5. Manter comentários automáticos (`bot-interact-with-post` e `bot-reply-user`)

Você não pediu para mexer e ainda há 7 comentários reais sendo respondidos no mês. Os 3 chat-bots (Lotofácil, Mega, Dupla) podem comentar normalmente — **postar é diferente de comentar**.

#### 6. Ajustar UI `/admin/bots`

Como agora só 1 bot posta, simplifico o card "Especialistas para Postagens": quando tem 1 bot, mostra como "Único Autor" com badge especial. Os 3 chat-bots ficam em "Especialistas para Chat" como já estão.

### Mudanças no banco (migration)

```sql
-- 1. Centralizar agenda no Palpite Tech (adicionar 13:30 com tipo estrategia)
UPDATE guide_personas 
SET post_schedule = jsonb_set(
  jsonb_set(post_schedule, '{horarios}', '["09:00","10:00","11:00","13:30","14:00","16:00"]'::jsonb),
  '{tipo_por_horario,13:30}', '"estrategia"'::jsonb
)
WHERE id = '2a827e7d-a3d1-416e-8552-e830dc7e633c'; -- Palpite Tech

-- 2. Tirar Especialista Lotofácil de postagens (vira só chat)
UPDATE guide_personas
SET can_create_posts = false,
    is_strategy_author = false,
    post_schedule = '{"dias":[],"horarios":[]}'::jsonb
WHERE id = '7625b931-48dc-4550-81f3-1f8bd8a0ce33'; -- Especialista Lotofácil

-- 3. Garantir que Mega e Dupla Sena também não criem posts (já não criam, mas trava)
UPDATE guide_personas
SET can_create_posts = false
WHERE id IN ('865470d7-ec46-4cd7-a6ce-9ad2fb672156', '9885c48e-edd9-4884-bbf0-67b1e3456996');
```

### Mudanças no código

- **`supabase/functions/generate-guide-post/index.ts`** — adicionar trava: se `guide.id !== palpite_tech_id` e `!guide.is_result_author`, retorna 403
- **`supabase/functions/generate-roundtable-post/`** — DELETAR (pasta inteira)
- **`src/pages/admin/AdminCustos.tsx`** — remover `"generate-roundtable-post"` de `FUNCTION_LABELS` e `FUNCTION_CATEGORIES`
- **`src/components/admin/BotCategoryFolder.tsx`** ou similar — pequeno ajuste visual quando categoria "Postagens" tem 1 só bot

### O que NÃO mexo

- Prompt do Palpite Tech, prompts de cada `tipo_por_horario`, modelo de IA, formatação, contexto enriquecido (frequências, atrasos, ciclo) — **zero alteração na qualidade do conteúdo**
- Ordem dos posts no dia (09h ciclo → 10h movimentação → 11h pares/ímpares → 13:30 estratégia novo → 14h repetidas → 16h moldura → 23h resultado oficial via sync-lotofacil)
- `process-scheduled-posts` (continua igual, só achará 1 bot ao invés de 2)
- `bot-interact-with-post`, `bot-reply-user`, `chat-assistant`, triggers do banco
- Posts antigos do Especialista Lotofácil (continuam visíveis assinados por ele, são histórico)
- Os 3 bots de chat (Lotofácil, Mega-Sena, Dupla Sena) — continuam atendendo no `/chat`

### Resultado

- **Único autor visível** na timeline da comunidade: Palpite Tech
- **Mesma cadência** de 6 posts/dia (1 resultado + 5 análises + 1 estratégia)
- **Mesma qualidade** (prompts e motores intactos)
- **Menos código:** ~700 linhas a menos (`generate-roundtable-post`)
- `/admin/bots`: 1 bot na pasta "Postagens", 3 na pasta "Chat"

### Fora de escopo

- Não mexo na geração de palpites, WhatsApp, sync de loterias, gravação
- Não mudo prompt de nenhum tipo de post
- Não removo bots do banco (Especialista Lotofácil continua existindo, só perde permissão de postar)
- Não removo triggers de comentário/resposta automática

