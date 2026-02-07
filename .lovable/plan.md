

## Plano: Nova Opção "Responder Posts de Outros Agentes"

### Contexto Atual

Atualmente, a função `bot-reply-user` **bloqueia** qualquer resposta quando detecta que o autor é um bot:

```typescript
if (authorProfile?.is_bot) {
  console.log(`Comentário de bot (${authorProfile.nome}) - ignorando para evitar loop`);
  return { skipped: true, reason: "bot_author" };
}
```

Isso impede completamente interações entre bots. Antes, a "mesa redonda" era um caso especial onde bots comentavam em posts de resultados, mas agora queremos dar a opção de um bot poder interagir com posts de **qualquer** outro bot.

### Solução Proposta

#### 1. Novo Campo no Banco de Dados

| Campo | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `can_respond_to_bot_posts` | boolean | false | Se true, este bot pode comentar em posts feitos por outros bots |

#### 2. Atualização da UI (BotAutomationTab)

Nova opção que aparece quando "Responder Comentários de Clientes" está ativo:

```text
┌─────────────────────────────────────────────────────┐
│ Responder Comentários de Clientes        [SWITCH]  │
│ Bot responde automaticamente a usuários humanos    │
│ ⚠️ Comentários de outros bots são ignorados        │
└─────────────────────────────────────────────────────┘
        ↓ (só aparece se switch acima = ON)
┌─────────────────────────────────────────────────────┐
│ ☐ Também Responder a Posts de Outros Agentes       │
│   Permite que este bot comente em publicações      │
│   feitas por outros bots da equipe (ex: resultado) │
│   ⚠️ Limitado a 1 resposta por post                │
└─────────────────────────────────────────────────────┘
```

#### 3. Atualização da Lógica Backend

Na função `bot-reply-user`, modificar a verificação de autor:

```typescript
// ANTES: Bloqueia sempre se autor é bot
if (authorProfile?.is_bot) { skip }

// DEPOIS: Verificar se o bot selecionado pode responder a posts de bots
// 1. Buscar guias que podem responder a bots
// 2. Se o post original for de bot E nenhum guia pode responder → skip
// 3. Se o post for de bot E há guia com can_respond_to_bot_posts=true → selecionar desses
```

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/migrations/` | Adicionar coluna `can_respond_to_bot_posts` |
| `src/types/bots.ts` | Adicionar campo ao tipo `GuidePersona` |
| `src/components/admin/BotAutomationTab.tsx` | Adicionar checkbox/switch condicional |
| `supabase/functions/bot-reply-user/index.ts` | Atualizar lógica de seleção de bot |

### Detalhes da Implementação

**1. Migration SQL:**
```sql
ALTER TABLE public.guide_personas 
ADD COLUMN can_respond_to_bot_posts boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.guide_personas.can_respond_to_bot_posts IS 
  'Se true, este bot pode comentar em posts criados por outros bots';
```

**2. BotAutomationTab - Nova Opção:**
```typescript
const [canRespondToBotPosts, setCanRespondToBotPosts] = useState(
  bot.can_respond_to_bot_posts ?? false
);

// Renderiza apenas se autoReply está ativo
{autoReply && (
  <div className="ml-4 flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
    <Checkbox 
      checked={canRespondToBotPosts}
      onCheckedChange={setCanRespondToBotPosts}
    />
    <div>
      <Label>Também Responder a Posts de Outros Agentes</Label>
      <p className="text-xs text-muted-foreground">
        Permite comentar em publicações de outros bots da equipe
      </p>
    </div>
  </div>
)}
```

**3. bot-reply-user - Lógica Atualizada:**
```typescript
// Verificar se autor do COMENTÁRIO é bot (evita loop de respostas a comentários)
if (authorProfile?.is_bot) {
  console.log(`Comentário de bot - ignorando sempre`);
  return { skipped: true, reason: "bot_comment_author" };
}

// Verificar se o POST original é de um bot
const { data: postAuthor } = await supabaseAdmin
  .from("perfis")
  .select("is_bot")
  .eq("id", postUserId)
  .single();

const postIsFromBot = postAuthor?.is_bot === true;

// Buscar guias filtrados
let guideQuery = supabaseAdmin
  .from("guide_personas")
  .select("...")
  .eq("ativo", true)
  .eq("auto_reply_enabled", true);

// Se o post é de bot, filtrar apenas guias que podem responder
if (postIsFromBot) {
  guideQuery = guideQuery.eq("can_respond_to_bot_posts", true);
}
```

### Proteções Anti-Loop

1. **Comentários de bots sempre ignorados**: Um bot nunca responde a um comentário feito por outro bot
2. **Limite por post**: `max_comments_per_post` ainda se aplica
3. **Verificação de duplicatas**: A lógica existente já verifica se já há resposta de bot no comentário

### Fluxo Visual

```text
┌───────────────────────────────────────────────────────────────┐
│ Post de "Augusto" (Bot - Autor dos Resultados)               │
│ "🚨 Resultado Concurso 3250..."                               │
├───────────────────────────────────────────────────────────────┤
│   ↓ Cliente "João" comenta: "Interessante!"                   │
│                                                               │
│   ┌─────────────────────────────────────────────────────────┐ │
│   │ Bot com can_respond_to_bot_posts=true pode responder    │ │
│   │ ao comentário do João mesmo o post sendo de outro bot   │ │
│   └─────────────────────────────────────────────────────────┘ │
│                                                               │
│   ↓ "Ana" (Bot) responde: "Exatamente, João! Note que..."    │
└───────────────────────────────────────────────────────────────┘
```

