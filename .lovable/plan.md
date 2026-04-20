

## Refatoração: Página `/admin/custos` (Custos IA)

Hoje tudo que **não tem `bot_persona_id`** cai no balde genérico **"Ação de Usuário"** — mesmo quando há um `user_id` claro (Augusto, João, Marcelo, Alex). E ferramentas que rodam com bot (chat-assistant, posts, replies) ficam misturadas com ações humanas. Vamos separar de verdade.

### Diagnóstico do que está acontecendo hoje

7 edge functions geram custo, em 2 categorias:

**Custo automático (bot/sistema, sem usuário pagante)**
- `generate-roundtable-post` → posts da Mesa Redonda (Ana, etc.)
- `bot-interact-with-post` → comentários automáticos de bots

**Custo por usuário (alguém real disparou)**
- `generate-palpites` (Lotofácil) — 167 chamadas, todas com `user_id`
- `generate-palpites-quina` — 12 chamadas, todas com `user_id`
- `auto-fill-fechamento` — 8 chamadas, todas com `user_id`
- `chat-assistant` — 16 chamadas, com `user_id` E `bot_persona_id` (o bot é o atendente)
- `bot-reply-user` — 6 chamadas, com `user_id` E `bot_persona_id` (resposta a comentário do user)

**Conclusão:** o balde "Ação de Usuário" da aba "Por Bot" é na verdade `chat-assistant` para o bot Especialista X mais geradores e auto-fills disparados por usuários reais identificáveis. Faltam: classificação por origem (auto vs humano), nome do usuário e detalhamento por ação.

### Mudanças

#### 1. Hook `useAiUsageLogs.ts` — enriquecer e reclassificar

- **JOIN com `perfis`** para trazer `nome` e `email` do `user_id` em cada log (1 fetch extra agrupado por ids únicos).
- Adicionar campo `origem` derivado:
  - `automatico` → `user_id IS NULL` (post de bot, comentário de bot)
  - `usuario` → `user_id IS NOT NULL` (geradores, chat, auto-fill, reply)
- Reescrever `computeSummary` para quebrar em 4 visões:
  - `byOrigem`: Automático vs Usuário (totais e %)
  - `byFerramenta`: por edge_function (renomeado, hoje "byFunction" já existe)
  - `byUsuario`: agrupado por `user_id` com nome/email reais (somente origem=usuario)
  - `byBot`: agrupado por `bot_persona_id` (somente onde existe — chat, posts, replies)

#### 2. Página `AdminCustos.tsx` — nova UI

**Novo card de resumo (5 cards em vez de 4):**
1. Custo Total USD
2. Custo Total BRL
3. Custo Automático (% do total) — bots postando/comentando sozinhos
4. Custo de Usuários (% do total) — disparado por usuários reais
5. Câmbio USD→BRL (mantém)

**Tabs reorganizadas (5 abas em vez de 4):**

| Aba | O que mostra | Por linha |
|---|---|---|
| **Por Origem** | Automático vs Usuário | Origem · Chamadas · Tokens · USD · BRL · % do total |
| **Por Ferramenta** | edge_function | Ferramenta (label PT) · Chamadas · Tokens · USD · BRL |
| **Por Usuário Real** | Apenas user_id (com JOIN perfis) | **Nome** · Email · Chamadas · Tokens · USD · BRL |
| **Por Bot** | Apenas bot_persona_id | Bot · Chamadas · Tokens · USD · BRL |
| **Log Detalhado** | Linha a linha (já existe) | Data · Ferramenta · **Nome do usuário ou Bot** · Modelo · Tokens · USD |

A coluna "Bot/Usuário" do log detalhado passa a mostrar:
- Se tem `user_id` → **nome** do `perfis` (em vez de `18688d84...`) com tooltip do email
- Se só tem `bot_persona_id` → nome do bot com badge "auto"
- Se tem os dois (chat/reply) → "Augusto → Especialista Mega-Sena"

**Filtros adicionais:**
- Manter: Data início/fim, Bot, Ferramenta
- Adicionar: **Filtro por Origem** (Todos / Automático / Usuário) e **Filtro por Usuário** (dropdown com nomes reais)

#### 3. Adicionar `FUNCTION_LABELS` faltantes

Hoje faltam labels para as 2 funções que aparecem nos dados reais:
```ts
"bot-interact-with-post": "Comentário Automático de Bot",
"bot-reply-user": "Resposta a Comentário de Usuário",
"generate-palpites-quina": "Gerador Quina",
```

E renomear para ficar mais explícito o que cada uma gasta:
- `generate-palpites` → "Gerador Lotofácil (usuário)"
- `chat-assistant` → "Chat IA (usuário ↔ bot)"
- `generate-roundtable-post` → "Post Automático Mesa Redonda (bot)"
- `auto-fill-fechamento` → "Auto-Fill Lotofácil (usuário)"

### Detalhes técnicos

- JOIN feito em JS (1 query separada `SELECT id, nome, email FROM perfis WHERE id = ANY(...)` com lista de ids únicos do batch de logs) para não precisar criar view nem mexer em RLS.
- Tipo `AiUsageLog` ganha `user_name?: string | null` e `user_email?: string | null` opcionais.
- `computeSummary` retorna shape novo `{ totalCostUsd, totalTokens, byOrigem, byFerramenta, byUsuario, byBot }` — mantém compatibilidade renomeando o que já existia.
- Sem migração de banco. Sem nova coluna. Apenas leitura + JOIN.

### Arquivos editados

- `src/hooks/useAiUsageLogs.ts` — enriquecer logs com perfis, novo `computeSummary`
- `src/pages/admin/AdminCustos.tsx` — 5 cards, 5 abas, filtros novos, nomes reais

### Resultado esperado

- Em vez de "Ação de Usuário · 18 chamadas · 27K tokens", você verá:
  - **Augusto Honorato** · Chat IA · 11 chamadas · 27K tokens · $0.0046
  - **Augusto Honorato** · Gerador Lotofácil · 81 chamadas · 123K tokens · $0.034
- Card "Custo Automático" deixa claro quanto a operação gasta sem ninguém clicar (bots postando) vs quanto vem de uso real.
- Filtro por usuário permite ver: "quanto o Augusto sozinho me custou esse mês?"

### Fora de escopo

- Não cria limites/alertas por usuário (pode virar feature depois).
- Não exporta CSV.
- Não muda nada nas edge functions — elas já gravam `user_id` corretamente.

