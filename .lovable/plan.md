

## Plano: Ajustes na Aba de Automação do Bot

### Problema Identificado
Atualmente, a aba de Automação não reflete visualmente as dependências entre configurações:

1. **Frequência de Posts**: A seção de agenda (dias, horários, frequência) permanece editável mesmo quando `can_create_posts` está desativado na aba Perfil
2. **Limite de Comentários**: Quando "Responder Comentários Automaticamente" está ativado, não mostra o campo `max_comments_per_post` (que já existe no banco de dados!)

### Solução Proposta

#### 1. Sincronizar Estado de `can_create_posts`
- Passar o valor de `can_create_posts` do bot para a aba de Automação
- Quando `can_create_posts = false`:
  - Desabilitar visualmente toda a seção de "Frequência de Posts"
  - Desabilitar os botões de dias da semana
  - Desabilitar o input de horários
  - Mostrar mensagem explicativa: "Ative 'Pode Criar Posts' no perfil para configurar a agenda"

#### 2. Adicionar Campo `max_comments_per_post`
- Quando `auto_reply_enabled = true`:
  - Exibir campo numérico para `max_comments_per_post`
  - Label: "Máximo de Respostas por Post"
  - Descrição: "Limite de comentários automáticos por postagem"
  - Valor padrão: 3 (já configurado no DB)

#### 3. Atualizar Tipo TypeScript
- Adicionar campos ausentes ao tipo `GuidePersona`:
  - `can_comment_on_posts: boolean`
  - `max_comments_per_post: number`

### Alterações Visuais

```text
┌─────────────────────────────────────────────────────┐
│ Responder Comentários Automaticamente    [SWITCH]  │
│ Bot responde automaticamente a comentários         │
└─────────────────────────────────────────────────────┘
        ↓ (só aparece se switch = ON)
┌─────────────────────────────────────────────────────┐
│ Máximo de Respostas por Post                       │
│ [  3  ]                                            │
│ Limite de comentários automáticos por postagem     │
└─────────────────────────────────────────────────────┘

─────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────┐
│ 📅 Agenda de Posts Automáticos                     │
│ ⚠️ Desativado (ative "Pode Criar Posts" no perfil) │ ← se can_create_posts = false
├─────────────────────────────────────────────────────┤
│ Frequência de Posts (por dia)   [INPUT disabled]   │
│ Dias de Postagem                [BUTTONS disabled] │
│ Horários de Postagem            [INPUT disabled]   │
└─────────────────────────────────────────────────────┘
```

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/types/bots.ts` | Adicionar `can_comment_on_posts` e `max_comments_per_post` ao tipo |
| `src/components/admin/BotAutomationTab.tsx` | Implementar lógica condicional e novo campo |

### Detalhes Técnicos

**BotAutomationTab.tsx - Mudanças:**

1. Adicionar estado para `maxCommentsPerPost`:
```typescript
const [maxCommentsPerPost, setMaxCommentsPerPost] = useState(bot.max_comments_per_post ?? 3);
```

2. Renderização condicional do limite de comentários:
```typescript
{autoReply && (
  <div className="space-y-2 ml-4 p-3 bg-muted/30 rounded-lg">
    <Label>Máximo de Respostas por Post</Label>
    <Input
      type="number"
      value={maxCommentsPerPost}
      onChange={(e) => setMaxCommentsPerPost(parseInt(e.target.value) || 1)}
      min={1}
      max={10}
      className="w-32"
    />
  </div>
)}
```

3. Desabilitar seção de agenda quando `can_create_posts = false`:
```typescript
const canConfigureSchedule = bot.can_create_posts;

// Na renderização dos inputs de frequência/dias/horários:
disabled={!canConfigureSchedule}
```

4. Atualizar `handleSubmit` para salvar `max_comments_per_post`

### Impacto
- **UX melhorada**: Usuário entende visualmente que a agenda depende de "Pode Criar Posts"
- **Controle granular**: Limite de comentários previne spam e comportamento excessivo do bot
- **Zero breaking changes**: Campos já existem no banco, apenas adicionamos controle na UI
