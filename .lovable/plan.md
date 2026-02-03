

# Plano: Gerador de Palpites com Bot Exclusivo

## Resumo
Criar uma ferramenta completa de geração de palpites para a Lotofácil, utilizando um bot de IA exclusivo que analisa os dados históricos do banco de dados e gera estratégias inteligentes com explicação detalhada.

## Estrutura da Solução

### 1. Nova Página `/gerador`
Uma interface dedicada e intuitiva onde o usuário:
- Escolhe a quantidade de jogos desejada (1 a 10)
- Clica em "Gerar Palpites"
- Visualiza os jogos gerados com as 15 dezenas cada
- Lê a explicação da estratégia utilizada pelo bot

### 2. Bot Exclusivo "Analista de Palpites"
Um novo bot na tabela `guide_personas` com:
- **Nome**: "PT Analista" (ou similar)
- **Especialidade**: Análise estatística e geração de jogos
- **Prompt otimizado**: Instruções para analisar dados e criar estratégias diversificadas
- **Tags**: `gerador_palpites` para identificação

### 3. Edge Function `generate-palpites`
Backend que:
1. Busca os últimos 50-100 resultados
2. Calcula estatísticas em tempo real (frequências, tendências, ciclos)
3. Monta contexto rico para a IA
4. Solicita palpites estruturados + explicação
5. Valida os jogos (15 dezenas únicas de 1-25)
6. Retorna resultado formatado

---

## Fluxo do Usuário

```text
┌─────────────────────────────────────────────────────────────┐
│                    Página /gerador                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  "Quantos jogos você quer gerar?"                   │   │
│  │                                                      │   │
│  │  [1] [2] [3] [4] [5] [6] [7] [8] [9] [10]           │   │
│  │                                                      │   │
│  │        [ 🎲 Gerar Palpites ]                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📊 Estratégia utilizada:                           │   │
│  │  "Analisei os últimos 50 concursos e identifiquei   │   │
│  │   que a combinação 7 pares + 8 ímpares tem..."      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Jogo 1:                                             │   │
│  │  [01] [03] [05] [07] [09] [11] [12] [14] [16]       │   │
│  │  [17] [18] [20] [22] [24] [25]                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Jogo 2: ...                                         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementação Técnica

### 3.1 Banco de Dados

**Nova feature no sistema de planos**:
- Adicionar `chat_gerador_palpites` às features disponíveis
- Configurar limite diário de gerações por plano (ex: 3/dia grátis, 10/dia premium)

**Criar bot na `guide_personas`**:
```
Nome: PT Analista
Cargo: Analista de Jogos
Especialidade: Geração de palpites baseada em dados
Badge: 🎲
chat_tags: ["gerador_palpites"]
```

**Tabela de controle (opcional)**:
- `gerador_daily_usage`: controlar uso diário por usuário

### 3.2 Edge Function `generate-palpites`

**Entrada**:
```json
{
  "quantidade": 3
}
```

**Processamento**:
1. Validar autenticação e permissão (`gerador` feature)
2. Verificar limite diário
3. Buscar dados estatísticos:
   - Últimos 50 resultados com todas as métricas
   - Dezenas mais/menos frequentes
   - Tendências de pares/ímpares/moldura/primos
   - Dezenas faltantes no ciclo atual
4. Montar prompt contextualizado para IA
5. Chamar Lovable AI com tool calling para estruturar resposta
6. Validar cada jogo gerado (15 dezenas únicas, 1-25)
7. Salvar registro de uso

**Saída**:
```json
{
  "jogos": [
    { "dezenas": [1, 3, 5, 7, 9, 11, 12, 14, 16, 17, 18, 20, 22, 24, 25] },
    { "dezenas": [2, 4, 6, 8, 10, 11, 13, 15, 17, 19, 20, 21, 23, 24, 25] }
  ],
  "estrategia": "Baseei os palpites na análise dos últimos 50 concursos...",
  "remaining_today": 7
}
```

### 3.3 Frontend

**Novos arquivos**:
- `src/pages/Gerador.tsx` - Página principal
- `src/hooks/useGerador.ts` - Hook para chamada da edge function
- `src/components/gerador/JogoCard.tsx` - Card com as 15 dezenas
- `src/components/gerador/EstrategiaCard.tsx` - Card com explicação

**Componentes**:
- Seletor de quantidade (botões 1-10)
- Botão de geração com loading state
- Cards de resultado com dezenas estilizadas (usando `DezenaCirculo` existente)
- Card de estratégia com markdown
- Indicador de usos restantes

### 3.4 Rotas e Navegação

- Adicionar rota `/gerador` em `App.tsx`
- Adicionar item no menu lateral/inferior
- Configurar como rota protegida

---

## Prompt do Bot Gerador

```text
Você é o PT Analista, especialista em análise estatística da Lotofácil.

DADOS DISPONÍVEIS:
- Últimos {N} resultados com dezenas sorteadas
- Frequência de cada dezena no período
- Tendências de pares/ímpares, moldura/miolo, primos
- Dezenas faltantes no ciclo atual
- Última combinação sorteada

REGRAS OBRIGATÓRIAS:
1. Cada jogo DEVE ter exatamente 15 dezenas únicas de 01 a 25
2. Diversifique as estratégias entre os jogos
3. Considere o equilíbrio histórico (ex: 7-8 pares/ímpares é comum)
4. Inclua pelo menos algumas dezenas faltantes do ciclo
5. NUNCA prometa vitória - loteria é probabilidade

AO GERAR:
- Explique brevemente a lógica de cada estratégia
- Cite dados específicos que embasaram a escolha
- Seja didático e acessível
```

---

## Controle de Acesso

| Plano | Gerações/Dia | Jogos/Geração |
|-------|--------------|---------------|
| Grátis | 1 | até 3 |
| Premium | 5 | até 10 |
| VIP | Ilimitado | até 10 |

---

## Arquivos a Criar/Modificar

### Criar:
1. `supabase/functions/generate-palpites/index.ts`
2. `src/pages/Gerador.tsx`
3. `src/hooks/useGerador.ts`
4. `src/components/gerador/JogoCard.tsx`
5. `src/components/gerador/EstrategiaCard.tsx`
6. `src/components/gerador/QuantidadeSelector.tsx`

### Modificar:
1. `src/App.tsx` - Adicionar rota
2. `src/types/plans.ts` - Adicionar feature
3. `src/lib/chatTopics.ts` - (opcional) Adicionar topic se integrar com chat
4. `src/components/layout/MobileBottomNav.tsx` - Adicionar ícone
5. `src/components/layout/DesktopHeader.tsx` - Adicionar link
6. `supabase/config.toml` - Registrar nova função

### Migração SQL:
- Criar bot "PT Analista" na `guide_personas`
- Adicionar `gerador_max_per_day` aos planos
- (Opcional) Criar tabela `gerador_daily_usage`

---

## Segurança

1. **Validação de jogos**: Backend valida que cada jogo tem exatamente 15 dezenas únicas de 1-25
2. **Rate limiting**: Controle por usuário/dia
3. **Permissão**: Verificar feature do plano antes de gerar
4. **Sanitização**: Não expor dados sensíveis na resposta da IA

---

## Resultado Esperado

Uma ferramenta intuitiva que:
- Permite gerar palpites com 1 clique
- Mostra jogos formatados de forma clara (como volante)
- Explica a estratégia usada (educativo)
- Respeita limites do plano do usuário
- Integra com o sistema de CTAs (botões para navegar)

