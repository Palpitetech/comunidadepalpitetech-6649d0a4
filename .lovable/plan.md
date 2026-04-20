

## Refatoração: Aba "Por Ferramenta" — visão real do gasto de tokens

### Diagnóstico (dados reais do banco agora)

7 ferramentas estão gerando custo. O nome "Auto-Fill Lotofácil" está **correto mas pouco explicativo** — confunde porque não diz o que ele realmente faz.

| edge_function | O que é de verdade | Disparo | Chamadas | Tokens (in / out) | USD |
|---|---|---|---|---|---|
| `generate-palpites` | Gera N jogos de Lotofácil para o usuário no Gerador | Usuário clica "Gerar palpites" | 167 | 181K / 66K | $0.1018 |
| `chat-assistant` | Conversa do usuário com bot especialista no Chat IA | Usuário envia msg no /chat | 16 | 35K / 2K | $0.0067 |
| `generate-palpites-quina` | Gera jogos de Quina para o usuário | Usuário clica "Gerar" na Quina | 12 | 13K / 4K | $0.0046 |
| **`auto-fill-fechamento`** | **Preenche automaticamente as dezenas do Fechamento da Lotofácil** com sugestão IA (botão "Quero Estratégia" em /fechamento) | Usuário clica "Quero Estratégia" no Fechamento | 8 | 8K / 2K | $0.0028 |
| `generate-roundtable-post` | Cria posts da Mesa Redonda automaticamente (Ana, etc.) | Cron / sistema | 11 | 6K / 2K | $0.0027 |
| `bot-reply-user` | Bot responde a comentário que o usuário deixou em post | Usuário comenta → bot responde | 6 | 4K / 0.2K | $0.0007 |
| `bot-interact-with-post` | Bot comenta automaticamente em post novo | Sistema | 6 | 2K / 0.4K | $0.0006 |

**O que é "Auto-Fill Lotofácil":** é a função `auto-fill-fechamento` chamada quando o usuário aperta o botão **"Quero Estratégia"** dentro de `/fechamento`. A IA analisa os últimos 4 concursos e sugere as dezenas que devem entrar no fechamento (separa fixas/variáveis quando a estratégia exige). Não é gerar palpite — é **preencher dezenas do fechamento automaticamente**.

### Mudanças

#### 1. Rótulos mais explícitos (`FUNCTION_LABELS` em `AdminCustos.tsx`)

Cada label vira uma frase curta que diz **o que é + onde acontece**:

```ts
const FUNCTION_LABELS = {
  // Por usuário
  "generate-palpites": "Gerador Lotofácil — gera N jogos no /gerador",
  "generate-palpites-quina": "Gerador Quina — gera N jogos no /gerador-quina",
  "generate-palpites-megasena": "Gerador Mega Sena — gera N jogos no /gerador-megasena",
  "generate-palpites-duplasena": "Gerador Dupla Sena — gera N jogos no /gerador-duplasena",
  "auto-fill-fechamento": "Auto-Preencher Fechamento Lotofácil — sugere dezenas no /fechamento",
  "auto-fill-megasena": "Auto-Preencher Fechamento Mega Sena",
  "auto-fill-duplasena": "Auto-Preencher Fechamento Dupla Sena",
  "chat-assistant": "Chat IA — conversa do usuário com bot no /chat",
  "bot-reply-user": "Resposta de Bot — bot responde comentário do usuário em post",
  // Automáticas
  "generate-roundtable-post": "Post Automático Mesa Redonda — bot cria post sozinho",
  "generate-guide-post": "Post Analítico de Guia — bot cria post sozinho",
  "bot-interact-with-post": "Comentário Automático — bot comenta em post novo",
};
```

Cada linha da tabela ganha também um **badge de origem** ao lado do nome (Auto/Usuário) para deixar visual.

#### 2. Tabela "Por Ferramenta" com breakdown real de tokens

Hoje só mostra `tokens` (soma). Vai virar:

| Ferramenta | Origem | Chamadas | Tokens IN (prompt) | Tokens OUT (resposta) | Total | Tokens / chamada | USD | USD / chamada | BRL |
|---|---|---|---|---|---|---|---|---|---|

- **Tokens IN (prompt)**: quanto contexto a função manda pra IA (geralmente é o maior — históricos, regras, etc.)
- **Tokens OUT (completion)**: quanto a IA respondeu (jogos, texto)
- **Tokens / chamada**: média por uso → mostra qual ferramenta é mais "pesada"
- **USD / chamada**: custo médio por uso → mostra qual cobra caro por interação
- Ordenação default: por USD desc (já está)
- Tooltip no nome da ferramenta com a descrição completa do que ela faz

Exemplo do que vai aparecer (dados reais):

```
Gerador Lotofácil [usuário]   167  181K  66K  248K  1.5K  $0.1018  $0.00061  R$ 0.5904
Chat IA [usuário]              16   35K   2K  38K   2.4K  $0.0067  $0.00042  R$ 0.0389
Auto-Preencher Fechamento Lotofácil [usuário]   8  8K  2K  11K  1.4K  $0.0028  $0.00036  R$ 0.0167
Post Mesa Redonda [auto]       11   6K    2K  9K    884   $0.0027  $0.00025  R$ 0.0161
```

#### 3. Atualizar `computeSummary` em `useAiUsageLogs.ts`

`byFerramenta` passa de `{ costUsd, tokens, count }` para:
```ts
{ costUsd, tokensIn, tokensOut, tokensTotal, count }
```
Soma `prompt_tokens` em `tokensIn` e `completion_tokens` em `tokensOut` (campos já existem em `AiUsageLog`).

### Arquivos editados

- `src/hooks/useAiUsageLogs.ts` — `byFerramenta` ganha `tokensIn`/`tokensOut`
- `src/pages/admin/AdminCustos.tsx` — labels explicativos + 4 colunas novas na aba "Por Ferramenta" + badge de origem por linha

### Resultado esperado

Você vai bater o olho na aba e entender na hora:
- **O que** cada ferramenta faz (label completo + tooltip)
- **Quanto** ela manda de input vs gera de output
- **Quanto custa por chamada** — fácil identificar a mais cara por uso
- **Quem dispara** (auto vs usuário) com badge ao lado

### Fora de escopo

- Não muda as outras abas (Por Origem, Por Usuário, Por Bot, Log)
- Não cria gráfico de evolução
- Não muda nada nas edge functions

