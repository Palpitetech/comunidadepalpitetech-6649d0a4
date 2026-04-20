

## Refatoração: Aba "Por Bot" — visão completa de todo bot que consome tokens

### Diagnóstico (varredura nos dados reais + código das edge functions)

**Bots que GASTAM tokens hoje** (logados em `ai_usage_logs` com `bot_persona_id`):

| Bot | Cargo | Ferramenta | Chamadas | Tokens | USD |
|---|---|---|---|---|---|
| Estrategista Lucas | Estratégias Lotofácil | chat-assistant | 14 | 34K | $0.0061 |
| Ana | Analista de Dados | generate-roundtable-post | 11 | 9.7K | $0.0028 |
| Especialista Mega-Sena | Mega-Sena | bot-reply-user | 6 | 4.4K | $0.0008 |
| Vendedor Matheus | Conversão | bot-interact-with-post | 2 | 1K | $0.0002 |
| Carlos / Fernanda / Sistema Tech | Lotofácil | bot-interact-with-post | 1 cada | ~500 | $0.0001 |

**Problemas encontrados:**

1. **`bot_name` vem `null` em vários logs** (chat-assistant grava `bot_name: null` propositalmente). Resultado: na tabela aparece "Bot" genérico em vez do nome real. Já temos o `bot_persona_id` — basta resolver via JOIN com `guide_personas`.
2. **A aba mostra só o agregado** (`Bot · Chamadas · Tokens · USD · BRL`). Não mostra **em quê** o bot gastou: postou? respondeu comentário? atendeu chat? Cada bot pode aparecer em múltiplas ferramentas (ex: Estrategista Lucas usa chat-assistant; Especialista Mega-Sena usa chat-assistant E bot-reply-user) e isso fica invisível.
3. **Falta categorização por tipo de ação** (Post automático / Comentário automático / Resposta a comentário / Chat com usuário).

**Bots que DEVERIAM gastar mas hoje não logam (gap de instrumentação):**

| Edge function | O que faz | Loga em `ai_usage_logs`? |
|---|---|---|
| `generate-guide-post` | Bot cria post analítico no /comunidade (cron) | ❌ não loga |
| `group-blast-send` (AI message + palpite) | Bot gera msg/palpite e envia em grupos WhatsApp | ❌ não loga |
| `group-blast` (mesmo) | idem (versão admin manual) | ❌ não loga |
| `warming-run` / `warming-manual` | Aquecimento de chip via IA | ❌ não loga |
| `sync-lotofacil` | IA dentro do sync? | ❌ não loga |

→ Esses **gastam tokens** mas o custo não aparece em lugar nenhum no painel. O foco do usuário ("Postagem na comunidade, geração palpite envio grupo X, Y, Gravação e etc...") cai exatamente nessas funções.

### Mudanças

#### 1. Adicionar logging de IA nas edge functions que faltam (parte 1 — bots da comunidade e WhatsApp)

Adicionar bloco `supabaseAdmin.from("ai_usage_logs").insert(...)` (mesmo padrão das outras 5 funções já instrumentadas) em:

- **`generate-guide-post`** → `bot_persona_id = guide.id`, `bot_name = guide.perfis.nome`, `edge_function = "generate-guide-post"`, `action_type = "post_analitico_comunidade"`
- **`group-blast-send`** (2 chamadas distintas):
  - `generateAIMessage` → `edge_function = "group-blast-ai-message"`, `action_type = "msg_post_para_grupo_whatsapp"`
  - `generatePalpiteMessage` → `edge_function = "group-blast-palpite"`, `action_type = "palpite_para_grupo_whatsapp"` (sem bot_persona_id — é sistema)
- **`group-blast`** (versão admin manual): mesmas 2, mas `edge_function = "group-blast-manual-ai-message"` e `"group-blast-manual-palpite"` para diferenciar do automático
- **`warming-run`** + **`warming-manual`** → `edge_function = "warming-run" / "warming-manual"`, `action_type = "aquecimento_chip"`
- **`sync-lotofacil`** → `edge_function = "sync-lotofacil"`, `action_type = "ia_no_sync"` (se a chamada IA é executada)

Isso fecha o buraco. Daqui pra frente tudo aparece.

#### 2. Hook `useAiUsageLogs.ts` — resolver nome do bot quando `bot_name` é null

Quando a query traz `bot_persona_id` mas `bot_name` é null (acontece com chat-assistant), JOIN extra com `guide_personas` (mesmo padrão do JOIN de `perfis` que já existe) para puxar `cargo + especialidade` como fallback.

`UsageSummary.byBot[bot_id]` ganha campo novo:
```ts
{
  name, costUsd, tokens, count,
  cargo: string | null,           // novo
  byFerramenta: Record<string, { count, tokens, costUsd, label }>,  // novo
  lastActivity: string | null,    // novo
}
```

#### 3. Aba "Por Bot" — vira expansível com drill-down por ação

Mesmo padrão da aba "Por Usuário" (já refatorada): cada linha de bot tem chevron, expande mostrando exatamente em qual ferramenta gastou.

**Linha principal (5 colunas + 3 novas):**

| Bot (nome + cargo) | Tipo de Ação Principal | Ações usadas | Última atividade | Chamadas | Tokens | USD | BRL |

- **Tipo de Ação Principal**: a ferramenta de maior `costUsd` traduzida (ex: "Chat com Usuário", "Post Comunidade")
- **Ações usadas**: badge "3 ações"
- **Última atividade**: data do último uso

**Sub-linhas ao expandir** (uma por ferramenta que o bot usou):
```
▼ Especialista Mega-Sena · Especialista
   └─ Chat com Usuário                   1     1.8K    $0.0003
   └─ Resposta a Comentário              6     4.4K    $0.0008
```

#### 4. Categorização visual por tipo de ação (badge ao lado da ferramenta)

Cada `edge_function` ganha um **tipo** com cor (mesmo esquema do badge auto/usuário da aba Por Ferramenta):

| edge_function | Categoria | Cor |
|---|---|---|
| `generate-roundtable-post`, `generate-guide-post` | **Post** | azul |
| `bot-interact-with-post` | **Comentário Automático** | roxo |
| `bot-reply-user` | **Resposta ao Usuário** | verde |
| `chat-assistant` | **Chat IA** | laranja |
| `group-blast-ai-message`, `group-blast-palpite`, `group-blast-manual-*` | **WhatsApp Grupo** | teal |
| `warming-run`, `warming-manual` | **Aquecimento Chip** | cinza |

#### 5. Atualizar `FUNCTION_LABELS` com as novas funções instrumentadas

```ts
"generate-guide-post": "Post Analítico Comunidade — bot cria post de análise (cron)",
"group-blast-ai-message": "Convite WhatsApp — bot gera msg de post p/ grupo (auto)",
"group-blast-palpite": "Palpite WhatsApp — bot gera palpite p/ grupo (auto)",
"group-blast-manual-ai-message": "Convite WhatsApp Manual — admin dispara",
"group-blast-manual-palpite": "Palpite WhatsApp Manual — admin dispara",
"warming-run": "Aquecimento de Chip — IA gera conversa entre chips (auto)",
"warming-manual": "Aquecimento de Chip Manual — admin dispara",
"sync-lotofacil": "Análise no Sync Lotofácil — IA roda durante sincronização",
```

### Detalhes técnicos

- Logging de IA nas edge functions usa exatamente o mesmo padrão das já instrumentadas (`supabaseAdmin.from("ai_usage_logs").insert({...})` com `prompt_tokens / completion_tokens / total_tokens / cost_usd` calculado com a função `estimateCost` já existente).
- `group-blast-send` e `group-blast` são chamadas pelo cron sem usuário autenticado → `user_id: null` (origem = automático).
- JOIN com `guide_personas` no hook é 1 query a mais agregada por ids únicos (mesma estratégia do JOIN com `perfis`).
- Sem migração de banco. Sem nova coluna.

### Arquivos editados

**Frontend:**
- `src/hooks/useAiUsageLogs.ts` — JOIN com guide_personas, novo shape de `byBot`
- `src/pages/admin/AdminCustos.tsx` — aba expansível + 3 colunas novas + badges de categoria + labels

**Edge functions (logging novo):**
- `supabase/functions/generate-guide-post/index.ts`
- `supabase/functions/group-blast-send/index.ts`
- `supabase/functions/group-blast/index.ts`
- `supabase/functions/warming-run/index.ts`
- `supabase/functions/warming-manual/index.ts`
- `supabase/functions/sync-lotofacil/index.ts`

### Resultado esperado

Hoje você vê: "Estrategista Lucas — 14 chamadas — $0.006".

Depois você verá:
```
▼ Estrategista Lucas · Estrategista     [Chat IA]   1 ação   há 2h    14   34K   $0.0061
   └─ Chat IA                                                          14   34K   $0.0061

▼ Ana · Analista de Dados               [Post]      1 ação   há 5h    11   9.7K  $0.0028
   └─ Post Mesa Redonda                                                11   9.7K  $0.0028

▼ Especialista Mega-Sena                [Resposta]  2 ações  há 1d    7    6.2K  $0.0011
   └─ Resposta a Comentário                                             6   4.4K  $0.0008
   └─ Chat com Usuário                                                  1   1.8K  $0.0003

▼ [Sistema] WhatsApp Grupos             [Grupo]     2 ações  hoje     45   78K   $0.034
   └─ Convite WhatsApp (auto)                                          30   52K   $0.022
   └─ Palpite WhatsApp (auto)                                          15   26K   $0.012
```

Resposta direta às perguntas reais:
- "Qual bot mais consome?" → ordenação por custo
- "Em quê ele gasta?" → expandir
- "Tem bot dormindo?" → coluna última atividade
- "Quanto custa o WhatsApp dos grupos?" → linha agrupada por categoria
- "Quanto custa um post automático?" → coluna USD/chamada na sub-linha

### Fora de escopo

- Não cria gráfico de evolução por bot
- Não cria limite/alerta por bot
- Não muda outras abas (Por Origem, Por Ferramenta, Por Usuário, Log)
- Não mexe em `generate-palpites-megasena`/`duplasena`/`auto-fill-megasena`/`duplasena` (já têm padrão de logging similar — se faltar, fica em outro PR de auditoria)

