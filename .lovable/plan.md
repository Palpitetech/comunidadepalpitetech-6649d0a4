

## Simplificar /admin/bots — manter o essencial, remover ruído

### Realidade dos bots (varredura agora)

Os bots **estão ativíssimos**: 4 ativos, **155 posts nos últimos 30 dias** (último hoje 18:59), 27 logs de IA, 3 atendendo chat. A aba é necessária — mas tem coisas que sobram.

### O que fica (essencial)

| Item | Por quê |
|---|---|
| **Lista de bots em pastas** (Especialistas para Postagens / Chat) | É onde você liga/desliga, vê quem está ativo, abre detalhe |
| **Sheet de detalhe do bot** com abas Perfil / Prompt IA / Automação / Posts | Onde se edita prompt, modelo de IA, agenda semanal, autoria de resultados |
| **Toggle ativo/inativo** na linha | Ação mais usada, fica acessível sem abrir |

### O que sai (ruído)

#### 1. Botão "Disparar Post Manual" (header)
**Remover.** Hoje os bots postam sozinhos por agenda (`process-scheduled-posts` cron) e o `sync-lotofacil` cria post automaticamente quando sai resultado. Disparo manual virou ferramenta legada que ninguém usa — e quando dispara, gera post fora de hora que confunde a comunidade.

→ Remove `<Dialog>` "Disparar Post" do header de `AdminBots.tsx`
→ Remove arquivo `src/components/admin/BotPostTrigger.tsx`

#### 2. Aba "Posts" dentro do detalhe do bot
**Remover.** Lista os últimos 20 posts do bot com botão de excluir. Você já tem isso melhor em `/comunidade` (vê o post no contexto real) e na aba "Por Bot" de `/admin/custos` (vê custo + frequência). Manter aqui é duplicar.

→ Remove arquivo `src/components/admin/BotPostsTab.tsx`
→ Em `BotDetailSheet.tsx`: tabs vão de 4 → 3 colunas (`grid-cols-3`), remove `<TabsTrigger value="posts">` e `<TabsContent value="posts">`

#### 3. Coluna "Estatísticas" da tabela (total_posts / total_comments)
**Remover.** São contadores incrementados por trigger que ninguém olha — informação real está em `/admin/custos` aba "Por Bot" (com custo, tokens, última atividade). Aqui só ocupa espaço.

→ Em `BotCategoryFolder.tsx`: remove `<TableHead>Estatísticas</TableHead>` e a `<TableCell>` correspondente
→ Coluna "Recursos" (badges Posts/Auto-reply/Chat) **fica** — informa o que o bot faz num relance

### O que NÃO mexo

- `useBots.ts`, tipos, edge functions, `guide_personas` no banco
- Sub-abas Perfil / Prompt IA / Automação (são onde se configura tudo)
- `BotHealthWidget` no painel principal
- `BotCategoryFolder` (estrutura de pastas continua)
- `WeeklyBotCalendar` dentro da aba Automação
- Função `deleteBot` (pode ser usada em rota futura, sem custo)

### Antes / depois

**Header hoje:** título + 1 botão grande "Disparar Post"  
**Header depois:** só título e descrição (mais limpo, foco na lista)

**Sheet hoje:** Perfil · Prompt IA · Automação · Posts (4 abas)  
**Sheet depois:** Perfil · Prompt IA · Automação (3 abas)

**Linha do bot hoje:** Avatar+nome+badges · 📄12 💬45 · [Posts] [Auto-reply] [Chat] · Toggle  
**Linha depois:** Avatar+nome+badges · [Posts] [Auto-reply] [Chat] · Toggle

### Detalhes técnicos

- 2 arquivos deletados, 3 editados
- Sem migração, sem mudança em edge functions
- Imports `MessageSquare`, `Dialog*`, `BotPostTrigger`, `triggerDialogOpen` saem de `AdminBots.tsx`
- Imports `FileText`, `MessageSquare` saem de `BotCategoryFolder.tsx` (não usados mais)
- `BotPostsTab` import sai de `BotDetailSheet.tsx`

### Arquivos editados

- `src/pages/admin/AdminBots.tsx` — remove botão e dialog de disparo manual
- `src/components/admin/BotDetailSheet.tsx` — remove aba Posts, vai pra grid-cols-3
- `src/components/admin/BotCategoryFolder.tsx` — remove coluna Estatísticas

### Arquivos deletados

- `src/components/admin/BotPostTrigger.tsx`
- `src/components/admin/BotPostsTab.tsx`

### Resultado

Aba mais enxuta, mesma capacidade de configurar tudo que importa (prompt, agenda, autoria, ligar/desligar). O que era duplicação com `/admin/custos` ou ação que nunca é usada some.

### Fora de escopo

- Não desativa nenhum bot
- Não muda lógica de posts automáticos
- Não remove edge functions
- Não mexe em `BotHealthWidget` nem no calendário semanal

