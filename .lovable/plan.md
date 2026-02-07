

## Plano: Novos Tipos de Autor - Estratégia e Palpites Grátis

### Resumo Executivo

Serão criados **dois novos papéis de autor** para bots na comunidade:

| Autor | Objetivo | Exemplo de Conteúdo |
|-------|----------|---------------------|
| **Autor de Estratégias** | Ensinar usuários a criar seus próprios palpites | "Como usar dezenas quentes para montar seu jogo" |
| **Autor de Palpites Grátis** | Fornecer sugestões gratuitas com explicação | "Palpite do dia: 01, 03, 05..." + estratégia usada |

---

### 1. Alterações no Banco de Dados

Adicionar duas novas colunas booleanas na tabela `guide_personas`:

| Coluna | Tipo | Default | Descrição |
|--------|------|---------|-----------|
| `is_strategy_author` | boolean | false | Bot publica posts ensinando estratégias |
| `is_free_tips_author` | boolean | false | Bot publica palpites grátis com explicação |

```text
┌──────────────────────────────────────────────────────────────┐
│ guide_personas                                               │
├──────────────────────────────────────────────────────────────┤
│ ...                                                          │
│ is_result_author      boolean  (já existe)                   │
│ is_strategy_author    boolean  NEW - Autor de Estratégias    │
│ is_free_tips_author   boolean  NEW - Autor de Palpites       │
└──────────────────────────────────────────────────────────────┘
```

---

### 2. Atualizações na UI Admin

#### 2.1 BotProfileTab - Novos Switches

Adicionar dois novos switches na seção de permissões especiais:

```text
┌─────────────────────────────────────────────────────┐
│ Autor dos Resultados                    [SWITCH]   │
│ Cria os posts de plantão de resultados oficiais    │
├─────────────────────────────────────────────────────┤
│ Autor de Estratégias                    [SWITCH]   │ NEW
│ Publica posts ensinando como montar palpites       │
├─────────────────────────────────────────────────────┤
│ Autor de Palpites Grátis                [SWITCH]   │ NEW
│ Compartilha palpites gratuitos com explicação      │
└─────────────────────────────────────────────────────┘
```

#### 2.2 BotPostTrigger - Novos Tipos de Post

Adicionar duas novas opções no seletor de tipo de post:

```text
Tipos existentes:
- pre_sorteio
- pos_sorteio  
- geral
- resultado_oficial

Novos tipos:
- estrategia         → "Dica de Estratégia"
- palpite_gratis     → "Palpite Grátis do Dia"
```

O bot selecionado para cada tipo será filtrado automaticamente:
- `resultado_oficial` → bots com `is_result_author = true`
- `estrategia` → bots com `is_strategy_author = true`
- `palpite_gratis` → bots com `is_free_tips_author = true`

#### 2.3 AdminBots - Novos Badges na Listagem

Adicionar badges visuais na lista de bots:

```text
🎯 Resultados    (is_result_author)
📚 Estratégia    (is_strategy_author)  NEW
🎁 Palpites      (is_free_tips_author) NEW
```

---

### 3. Backend - Edge Functions

#### 3.1 Atualização: `generate-bot-post/index.ts`

Adicionar lógica específica para os novos tipos de post:

**Para tipo `estrategia`:**
- Prompt focado em ENSINAR técnicas
- Usa dados estatísticos como exemplo didático
- Não fornece números específicos para jogar
- Convida usuários a aplicar a técnica

**Para tipo `palpite_gratis`:**
- Gera um jogo completo de 15 dezenas
- Explica a estratégia usada (similar ao Gerador)
- Inclui aviso sobre responsabilidade
- Limite: 1 palpite por post (não abusa)

#### 3.2 Prompts Específicos

```text
┌─────────────────────────────────────────────────────────────────┐
│ ESTRATÉGIA                                                       │
│──────────────────────────────────────────────────────────────────│
│ Você é um educador da Lotofácil. Seu papel é ENSINAR técnicas,  │
│ não dar palpites prontos.                                        │
│                                                                  │
│ Neste post, escolha UMA técnica e explique passo a passo:       │
│ - Como funciona                                                  │
│ - Quando usar                                                    │
│ - Exemplo prático com dados reais                                │
│ - Convide o usuário a tentar por conta própria                  │
│                                                                  │
│ Técnicas disponíveis:                                            │
│ - Análise de dezenas quentes/frias                              │
│ - Ciclo de dezenas                                               │
│ - Equilíbrio pares/ímpares                                       │
│ - Duplas e trios frequentes                                      │
│ - Moldura do volante                                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ PALPITE GRÁTIS                                                   │
│──────────────────────────────────────────────────────────────────│
│ Você vai compartilhar UM palpite grátis para a comunidade.       │
│                                                                  │
│ REGRAS:                                                          │
│ 1. Gere EXATAMENTE 15 dezenas únicas de 01 a 25                 │
│ 2. Explique brevemente a estratégia usada (1-2 frases)          │
│ 3. Inclua sempre o aviso: "Loteria é sorte, jogue responsável!" │
│ 4. Formato: liste as dezenas separadas por vírgula              │
│                                                                  │
│ Use os dados estatísticos fornecidos para embasar sua escolha.  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4. Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/migrations/` | Adicionar colunas `is_strategy_author` e `is_free_tips_author` |
| `src/types/bots.ts` | Adicionar campos ao tipo `GuidePersona` |
| `src/components/admin/BotProfileTab.tsx` | Adicionar 2 novos switches |
| `src/components/admin/BotPostTrigger.tsx` | Adicionar tipos `estrategia` e `palpite_gratis` |
| `src/pages/admin/AdminBots.tsx` | Adicionar badges na listagem |
| `src/components/admin/BotDetailSheet.tsx` | Adicionar badges no header |
| `supabase/functions/generate-bot-post/index.ts` | Adicionar prompts específicos para novos tipos |

---

### 5. Fluxo de Uso

```text
┌─────────────────────────────────────────────────────────────────┐
│ ADMIN: /admin/bots                                              │
│                                                                  │
│ 1. Abre perfil do bot "Ana" (Analista de Dados)                 │
│ 2. Ativa "Autor de Estratégias" ✓                               │
│ 3. Salva                                                         │
│                                                                  │
│ 4. Vai para "Disparar Post Manual"                              │
│ 5. Seleciona tipo: "Dica de Estratégia"                         │
│ 6. Sistema filtra apenas bots com is_strategy_author=true       │
│ 7. Publica                                                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ RESULTADO NA COMUNIDADE:                                         │
│                                                                  │
│ 📚 Ana | Analista de Dados                                       │
│ ──────────────────────────────────────────────────────────────── │
│ "🎯 Técnica: Equilíbrio Pares/Ímpares"                          │
│                                                                  │
│ Você sabia que nos últimos 50 sorteios, 78% tiveram entre       │
│ 7 e 8 pares? Aqui vai como usar isso a seu favor...             │
│                                                                  │
│ 1. Monte seu jogo com 7 ou 8 números pares                      │
│ 2. Complete com 7 ou 8 ímpares                                   │
│ 3. Verifique se está equilibrado                                 │
│                                                                  │
│ Tente aplicar essa técnica no próximo jogo! 🍀                   │
└─────────────────────────────────────────────────────────────────┘
```

---

### 6. Detalhes Técnicos

#### 6.1 Migration SQL

```sql
-- Adicionar colunas de autor especializado
ALTER TABLE public.guide_personas 
ADD COLUMN is_strategy_author boolean NOT NULL DEFAULT false,
ADD COLUMN is_free_tips_author boolean NOT NULL DEFAULT false;

-- Comentários explicativos
COMMENT ON COLUMN public.guide_personas.is_strategy_author IS 
  'Se true, este bot publica posts ensinando estratégias de jogo';

COMMENT ON COLUMN public.guide_personas.is_free_tips_author IS 
  'Se true, este bot publica palpites grátis com explicação da estratégia';
```

#### 6.2 BotPostTrigger - Lógica de Filtro

```typescript
// Filtrar bots por tipo de post
const getAvailableBots = (postType: PostType) => {
  switch (postType) {
    case "resultado_oficial":
      return bots.filter(b => b.is_result_author);
    case "estrategia":
      return bots.filter(b => b.is_strategy_author);
    case "palpite_gratis":
      return bots.filter(b => b.is_free_tips_author);
    default:
      return bots.filter(b => b.can_create_posts);
  }
};
```

#### 6.3 generate-bot-post - Prompts Condicionais

```typescript
// Instruções específicas por tipo
function getInstrucoesTipo(tipo: string, contexto: string): string {
  switch (tipo) {
    case "estrategia":
      return `OBJETIVO: Ensinar UMA técnica de análise.
      
ESTRUTURA:
1. Título da técnica
2. Explicação simples (como funciona)
3. Exemplo com dados reais: ${contexto}
4. Convite para o usuário tentar

NÃO dê palpites prontos, apenas ensine a técnica.`;

    case "palpite_gratis":
      return `OBJETIVO: Compartilhar UM palpite grátis.

ESTRUTURA:
1. Título chamativo (ex: "Palpite do Dia 🎲")
2. 15 dezenas separadas por vírgula
3. Breve explicação da estratégia (1-2 frases)
4. Aviso: "Loteria é sorte, jogue com responsabilidade!"

Use os dados: ${contexto}`;

    default:
      return `Crie um post geral sobre análise.`;
  }
}
```

---

### 7. Considerações de Segurança

- **Palpites Grátis**: Limitar a 1 jogo por post para não substituir a ferramenta premium
- **Estratégias**: Não revelar algoritmos proprietários, apenas técnicas públicas
- **Disclaimers**: Sempre incluir aviso sobre jogo responsável
- **Rate Limit**: Manter limites de frequência existentes por bot

