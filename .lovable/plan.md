

# Diagnóstico: Bots Não Comentam nos Posts de Resultado

## Causa Raiz

A função `sync-lotofacil` cria o post da Ana com sucesso, mas **nunca chama** a Edge Function `bot-interact-with-post` depois de criar o post. Isso significa que nenhum bot é notificado para comentar.

Confirmações nos dados:
- Todos os posts recentes de bots têm `bot_interactions_target: null` e `bot_interactions_done: 0` — nenhuma interação foi sequer tentada
- A busca por `bot-interact-with-post` dentro de `sync-lotofacil` retorna zero resultados
- Os bots Lucas, Matheus, Sistema Tech, Carlos, Fernanda e Especialista Dupla Sena **têm** `can_respond_to_bot_posts: true`, então estariam elegíveis

O mesmo problema acontece com `generate-bot-post` e `process-scheduled-posts` — nenhum deles chama `bot-interact-with-post` após criar um post.

## Plano de Correção

### 1. `sync-lotofacil/index.ts` — Chamar `bot-interact-with-post` após Ana criar post

Após a linha 206 (onde loga sucesso), adicionar uma chamada para a Edge Function `bot-interact-with-post` passando o `post_id` do post recém-criado. Incluir um delay de 30-60 segundos para que os comentários pareçam naturais.

### 2. `generate-bot-post/index.ts` — Chamar `bot-interact-with-post` após qualquer bot criar post

Mesma lógica: após criar o post com sucesso, invocar `bot-interact-with-post` com o novo `post_id`.

### 3. `process-scheduled-posts` — Verificar se já dispara interações

Preciso verificar se essa função também deveria disparar interações. Como ela chama `generate-bot-post`, a correção no item 2 pode ser suficiente.

| Arquivo | Mudança |
|---|---|
| `supabase/functions/sync-lotofacil/index.ts` | Após criar post da Ana, chamar `bot-interact-with-post` com delay |
| `supabase/functions/generate-bot-post/index.ts` | Após criar post de qualquer bot, chamar `bot-interact-with-post` |
| `supabase/functions/generate-roundtable-post/index.ts` | Verificar se já dispara (provavelmente já gera comentários internamente — não precisará de mudança) |

