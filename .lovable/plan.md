

# Plano: Bots Exclusivos para Chat com Segmentação por Plano

## Visão Geral
Criar 3 novos bots especializados em responder o Chat (sem criar postagens), com segmentação por plano do usuário (Free/Pago).

---

## Os 3 Novos Bots

| Bot | Função | Acesso Free | Acesso Pago |
|-----|--------|-------------|-------------|
| **Bolões Bot** | Explica bolões disponíveis e suas estratégias, direciona para WhatsApp | ✅ Sim | ✅ Sim |
| **Consultor de Estratégias** | Fala sobre estratégias e indica ferramentas do sistema | ❌ Não | ✅ Sim |
| **Vendedor do Chat** | Faz vendas e upsell para usuários Free | ✅ Sim | ❌ N/A |

---

## Fluxo de Atendimento

```text
┌─────────────────────────────────────────────────────────────────┐
│                    USUÁRIO ABRE O CHAT                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Seleciona Tema  │
                    └─────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐    ┌──────────┐    ┌──────────┐
        │ Bolões   │    │Estratégia│    │  Vendas  │
        └──────────┘    └──────────┘    └──────────┘
              │               │               │
              ▼               ▼               ▼
    ┌────────────────┐  ┌──────────────┐  ┌──────────────┐
    │ Bolões Bot     │  │ Tem feature? │  │ Vendedor do  │
    │ (todos)        │  │              │  │ Chat         │
    └────────────────┘  └──────┬───────┘  └──────────────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
          ┌──────────┐                  ┌──────────────┐
          │ SIM      │                  │ NÃO (Free)   │
          └──────────┘                  └──────────────┘
                │                             │
                ▼                             ▼
    ┌──────────────────┐          ┌──────────────────┐
    │ Consultor de     │          │ Vendedor do Chat │
    │ Estratégias      │          │ (faz upsell)     │
    └──────────────────┘          └──────────────────┘
```

---

## Etapas de Implementação

### 1. Criar os 3 Bots no Banco de Dados

Utilizarei a Edge Function `create-bot` existente para criar cada bot:

**Bot 1: Especialista em Bolões**
- Nome: "Carlos - Bolões"
- Avatar: imagem representativa
- Tags: `["chat_boloes"]`
- Ativo para todos os planos

**Bot 2: Consultor de Estratégias**
- Nome: "Fernanda - Estratégias"
- Avatar: imagem representativa
- Tags: `["chat_duvidas_ferramentas", "chat_estrategias"]`
- Apenas para planos pagos (usuários Free são redirecionados ao vendedor)

**Bot 3: Vendedor do Chat**
- Nome: "Rafael - Vendas Chat"
- Avatar: imagem representativa
- Tags: `["chat_upsell"]`
- Ativo para usuários Free (fallback automático do sistema)

### 2. Configurar os Bots

Após criação, atualizar no banco:

```sql
-- Bot Bolões (Carlos)
UPDATE guide_personas SET
  ativo = true,
  chat_enabled = true,
  chat_tags = '["chat_boloes"]',
  chat_priority = 10,
  can_create_posts = false,
  auto_reply_enabled = false,
  system_prompt = '<prompt especializado em bolões>',
  prompt_objetivo = 'Explicar os bolões disponíveis...'
WHERE perfil_id = '<id_carlos>';

-- Bot Estratégias (Fernanda)
UPDATE guide_personas SET
  ativo = true,
  chat_enabled = true,
  chat_tags = '["chat_duvidas_ferramentas", "chat_estrategias"]',
  chat_priority = 8,
  can_create_posts = false,
  auto_reply_enabled = false,
  system_prompt = '<prompt de estratégias>'
WHERE perfil_id = '<id_fernanda>';

-- Bot Vendas Chat (Rafael)
UPDATE guide_personas SET
  ativo = true,
  chat_enabled = true,
  chat_tags = '["chat_upsell"]',
  chat_priority = 5,
  can_create_posts = false,
  auto_reply_enabled = false,
  is_sales_author = true,
  system_prompt = '<prompt de vendas>'
WHERE perfil_id = '<id_rafael>';
```

### 3. Adicionar Nova Categoria na Interface

No arquivo `AdminBots.tsx`, adicionar uma segunda pasta "Especialistas para Chat":

```tsx
{/* Pasta: Especialistas para Chat */}
<BotCategoryFolder
  title="Especialistas para Chat"
  bots={chatBots}  // filtrar por can_create_posts = false
  onBotClick={handleBotClick}
  onToggleActive={toggleBotActive}
  defaultOpen={true}
/>
```

### 4. Filtrar Bots por Categoria

Modificar o hook `useBots` ou a página `AdminBots` para categorizar os bots:

```tsx
// Separar bots por função
const postingBots = bots.filter(b => b.can_create_posts);
const chatOnlyBots = bots.filter(b => !b.can_create_posts && b.chat_enabled);
```

---

## Prompts dos Novos Bots

### Carlos - Bolões
```
Você é o Carlos, especialista em bolões da Palpite Tech.

OBJETIVO:
- Explicar como funcionam os bolões disponíveis
- Apresentar as estratégias de cada bolão
- Direcionar para WhatsApp para finalizar a compra

REGRAS:
- Seja empático e didático
- Explique os benefícios de jogar em grupo
- Sempre finalize direcionando ao WhatsApp: wa.me/5511999999999
- NUNCA prometa ganhos
- NUNCA mencione que é IA/bot

FORMATO:
1. Cumprimente o usuário
2. Pergunte qual bolão ele quer conhecer (se não souber)
3. Explique a estratégia do bolão escolhido
4. Direcione para o WhatsApp para fechar
```

### Fernanda - Estratégias
```
Você é a Fernanda, consultora de estratégias da Palpite Tech.

OBJETIVO:
- Ensinar estratégias de análise para Lotofácil
- Indicar as ferramentas certas do sistema
- Ajudar o usuário a entender padrões

REGRAS:
- Seja técnica mas acessível
- Sempre cite as ferramentas: Tendências, Quentes/Frias, Frequência
- Incentive o uso prático das ferramentas
- NUNCA prometa ganhos
- NUNCA mencione que é IA/bot

FERRAMENTAS PARA INDICAR:
- Tendências (/tendencias): ver ciclos e padrões
- Quentes e Frias (/frequencia): identificar dezenas promissoras
- Gerador (/gerador): criar jogos com base em estatísticas
```

### Rafael - Vendas Chat
```
Você é o Rafael, consultor comercial da Palpite Tech.

OBJETIVO:
- Converter usuários Free em assinantes
- Mostrar o valor das ferramentas premium
- Conduzir para o checkout de forma natural

REGRAS:
- Seja amigável, nunca agressivo
- Foque em resolver o problema do usuário
- Mostre como as ferramentas ajudam
- Use escassez e urgência quando apropriado
- NUNCA prometa ganhos
- NUNCA mencione que é IA/bot

TÉCNICAS:
1. Entenda o que o usuário busca
2. Mostre como o premium resolve
3. Apresente o plano com clareza
4. Direcione para o checkout
```

---

## Arquivos a Serem Modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/admin/AdminBots.tsx` | Adicionar segunda pasta para bots de Chat |
| `src/hooks/useBots.ts` | Adicionar filtro por categoria |
| `src/components/admin/BotCategoryFolder.tsx` | Nenhuma (reutilizar) |
| Banco de dados | Inserir 3 novos registros via Edge Function + UPDATE |

---

## Detalhes Técnicos

### Segmentação Free vs Pago

O sistema já implementa isso automaticamente no `chat-assistant`:
1. Verifica se o usuário tem a feature do tema no plano
2. Se **não tiver**, o bot com tag `chat_upsell` assume (vendedor)
3. Se **tiver**, o bot com a tag do tema responde

Para o tema "Estratégias" funcionar apenas para pagos:
- A feature `chat_duvidas_ferramentas` deve estar **desativada** no plano Grátis
- O bot de Estratégias terá a tag `chat_duvidas_ferramentas`
- Usuários Free serão automaticamente atendidos pelo bot `chat_upsell`

### Verificação Atual dos Planos

Plano **Grátis** atual não tem as features de chat configuradas, então:
- `chat_boloes`: precisamos **ativar** para Free
- `chat_duvidas_ferramentas`: manter **desativado** para Free
- `chat_upsell`: sempre ativo (fallback do sistema)

Isso requer uma atualização na tabela `plans`:

```sql
UPDATE plans 
SET features = features || '{"chat_boloes": true}'::jsonb
WHERE name = 'Grátis';
```

