

## Posts pós-15h: foco em "Como Fazemos" (transparência metodológica)

Até as 15h o usuário recebe **8 posts de análise** com recomendações diretas. Após as 15h, a estratégia vira **educação e bastidores**: explicar a matemática, mostrar o método, aumentar confiança e diferenciar a Palpite Tech de qualquer outro grupo de palpites.

Das 12 sugestões que você levantou, **6 são posts** (encaixam pós-15h) e **6 são telas/painéis interativos** (não são posts — viram features na app, fora do escopo desta entrega). Vou tratar só dos posts e propor uma agenda fechada.

### Nova agenda completa

| Horário | Post | Foco |
|---|---|---|
| 08:00–15:00 | 8 posts de análise | Recomendação direta (já implementado) |
| **16:00** | 🆕 **analise_cenarios** | 3 cenários do dia (conservador/equilibrado/agressivo) |
| **17:00** | 🆕 **analise_ficar_de_olho** | Dezenas desacelerando + alerta de queda |
| **18:00** | 🆕 **analise_como_calculamos** | Bastidores: regras, validações, anti-alucinação |
| Evento | resultado_oficial | Disparado pela sync após sorteio |

Três posts novos, sequenciais, encerrando o dia às 18h — antes do sorteio das 20h.

---

## Post 1 — `analise_cenarios` (16:00)

**Conceito:** consolida todas as 8 análises do dia em **3 perfis prontos** com probabilidades reais por faixa de repetição.

```text
🎲 Cenários do Concurso 3668

Olá pessoal!

Hoje publicamos 8 análises. Agora vamos juntar tudo em 3 perfis de palpite,
para você escolher o que combina com seu estilo.

📊 Probabilidades por faixa de repetição (últimos 10 sorteios)
• 8 a 9 repetidas: 60% dos concursos
• 10 repetidas: 25%
• 7 ou menos: 15%

🛡️ CENÁRIO CONSERVADOR (joga seguro)
Foco: alta repetição + dezenas fiéis
Repete: 9 do último → 03, 05, 11, 13, 17, 20, 21, 23, 25
Novas: 6 dezenas das fortes históricas → 01, 07, 09, 15, 18, 22
Probabilidade alvo: ficar dentro do padrão 60%

⚖️ CENÁRIO EQUILIBRADO (recomendado)
Foco: média de repetição + mistura de fortes e médias
Repete: 8 do último → 03, 05, 11, 13, 17, 20, 23, 25
Novas: 7 dezenas → 02, 06, 09, 14, 18, 21, 24
Combina: núcleo das linhas + duplas auditadas

🚀 CENÁRIO AGRESSIVO (busca prêmios maiores)
Foco: baixa repetição + apostar em movimentação
Repete: 6 do último → 03, 11, 17, 20, 23, 25
Novas: 9 dezenas → 02, 06, 08, 09, 14, 16, 19, 22, 24
Risco: 15% de chance histórica, mas distribui melhor o prêmio

⚠️ Lembre-se: probabilidade não é garantia. Use como guia.
```

**Motor:** nova função `montarCenariosDoDia(concursos)` que cruza dados das 8 análises já calculadas e gera 3 jogos de 15 dezenas distintos. Determinístico, sem IA inventando dezenas.

---

## Post 2 — `analise_ficar_de_olho` (17:00)

**Conceito:** alerta sobre dezenas em **desaceleração** (saíam muito, agora caíram) — o lado oposto das "quentes que continuam quentes".

```text
👀 Ficar de Olho — Concurso 3668

Olá pessoal!

Algumas dezenas estão perdendo força nos últimos sorteios.
Não significa que não vão sair — significa que o padrão delas mudou
e merece atenção antes de você fixar.

📉 TOP 5 dezenas em desaceleração (janela 5 vs 5)

🔴 Dezena 12
   Janela anterior (sorteios 6-10): 5 vezes
   Janela recente (sorteios 1-5): 1 vez
   Queda: -4 (delta forte)
   Resumo: estava entre as quentes, virou borderline.

🔴 Dezena 19
   Anterior: 4 → Recente: 1   Queda: -3
   Resumo: 3 sorteios consecutivos sem sair.

🔴 Dezena 06
   Anterior: 4 → Recente: 1   Queda: -3
   Resumo: caiu para a faixa fria.

🟡 Dezena 24
   Anterior: 3 → Recente: 1   Queda: -2
   Resumo: alerta médio, ainda pode reagir.

🟡 Dezena 08
   Anterior: 3 → Recente: 1   Queda: -2
   Resumo: vinha estável, perdeu ritmo.

📊 O que isso significa para o 3668?
Em 7 dos últimos 10 sorteios, pelo menos 1 dezena em desaceleração
voltou a sair no concurso seguinte (efeito "ressaca"). Ou seja:
não exclua todas — escolha 1 ou 2 como apoio.

💡 Recomendação tática
🎯 Manter atenção: 12 e 19 (maior queda)
➕ Considerar 1 como apoio: 06 ou 24
❌ Pode excluir nesta rodada: 08 (movimento mais fraco)

Loteria envolve sorte. Use como guia, não como certeza.
```

**Motor:** usa o cálculo de aceleração/desaceleração já planejado (janelas 5 vs 5) — mesmo cálculo que vai alimentar o post de Quentes/Frias quando ele for enriquecido. Aqui é o foco principal.

---

## Post 3 — `analise_como_calculamos` (18:00)

**Conceito:** post educacional fixo (varia pouco dia a dia) que mostra **a metodologia da Palpite Tech**. Aumenta confiança, diferencia da concorrência, ensina o usuário.

```text
🔬 Como Calculamos — Bastidores do Concurso 3668

Olá pessoal!

Você já recebeu 8 análises hoje. Agora a transparência total: como
chegamos em cada número.

📊 Janela de análise
Todos os posts usam os ÚLTIMOS 10 SORTEIOS oficiais da Lotofácil.
Concursos analisados hoje: 3658 a 3667 (10 sorteios = 150 dezenas).

📐 Regras de ordenação
Em cada concurso, as 15 dezenas são ordenadas em ORDEM CRESCENTE
antes de qualquer cálculo de posição (P1=menor, P15=maior).

🎯 Como uma dupla "auditada" entra no ranking
Para uma dupla aparecer como recomendada, ela precisa:
1. Ter saído juntas em pelo menos 3 dos últimos 10 sorteios
2. Passar por RECONTAGEM independente (segundo motor confere)
3. Ambas dezenas devem estar no último sorteio (validade contextual)
4. Não ter colisão com outras duplas do mesmo grupo

✅ Anti-alucinação (proteção contra erro de IA)
Cada post tem uma WHITELIST de números permitidos (01-25 + datas).
Qualquer número fora da lista faz o post ser DESCARTADO e
substituído por uma versão 100% calculada (fallback determinístico).

🔍 Definições oficiais
• FIÉL: dezena que repetiu em ≥ 60% dos pares de concursos seguidos
• VOLÁTIL: dezena que repetiu em ≤ 20% dos pares de concursos seguidos
• QUENTE: top 5 mais frequentes nos 10 sorteios
• FRIA: bottom 5 menos frequentes nos 10 sorteios
• ACELERANDO: delta positivo na janela 5 vs 5
• DESACELERANDO: delta negativo na janela 5 vs 5

🛡️ Validações ativas em todos os posts
• Transições reais entre concursos consecutivos
• Mínimo de 2 ocorrências para entrar em qualquer ranking
• Verificação de pertencimento ao mesmo eixo (linhas/colunas)
• Recontagem independente de duplas e trios

💡 Por que isso importa?
A maioria dos grupos joga "achismo". Aqui cada número tem origem
matemática rastreável e validação dupla. Você não está apostando
no palpite de alguém — está apostando em padrão estatístico real.

Loteria envolve sorte. Mas com método, a sorte trabalha melhor.
```

**Motor:** post com **conteúdo majoritariamente fixo** (a metodologia não muda) + variáveis dinâmicas (faixa de concursos do dia, número total). Texto humanizado pela IA na abertura/fechamento, corpo literal.

---

## Arquivo afetado

**Apenas:** `supabase/functions/generate-guide-post/index.ts`

### 1. Novo motor `montarCenariosDoDia(concursos)`
- Calcula taxa real de repetição por faixa (8-9, 10, ≤7).
- Monta 3 jogos distintos (conservador/equilibrado/agressivo) cruzando: top fortes históricas, núcleo das linhas, padrão de repetição.
- Garante 15 dezenas válidas e distintas em cada cenário.

### 2. Novo motor `analisarDesaceleracao(concursos)`
- Janela móvel 5 vs 5: compara `concursos[0..4]` (recente) com `concursos[5..9]` (anterior).
- Retorna top 5 dezenas com maior delta negativo.
- Calcula "efeito ressaca": % de sorteios em que uma desacelerada voltou.

### 3. Novo motor `montarComoCalculamos(concursos)`
- Conteúdo majoritariamente fixo + 2 variáveis: range de concursos analisados, número do próximo concurso.
- Sem cálculos pesados — é educacional.

### 4. Novos cases em `montarFatos()`, `montarTituloDeterministico()`, `montarPrompt()`
- 3 novos tipos: `analise_cenarios`, `analise_ficar_de_olho`, `analise_como_calculamos`.
- Limite: 2200 caracteres cada.
- Reprodução literal dos blocos numéricos.

### 5. Migrations SQL (2 arquivos)

**Schema:** atualizar constraint `postagens_tipo_check` para aceitar os 3 novos tipos.

**Dados (insert tool):** inserir 3 novos schedules ativos:
```sql
INSERT INTO public.post_schedules (tipo_post, horario, dias, ativo, loteria) VALUES
  ('analise_cenarios',         '16:00', '{0,1,2,3,4,5,6}', true, 'lotofacil'),
  ('analise_ficar_de_olho',    '17:00', '{0,1,2,3,4,5,6}', true, 'lotofacil'),
  ('analise_como_calculamos',  '18:00', '{0,1,2,3,4,5,6}', true, 'lotofacil');
```

### 6. Disparo manual de teste
Após deploy, chamar `generate-guide-post` para os 3 novos tipos para gerar a 1ª versão imediatamente.

---

## O que NÃO entra nesta entrega (são features de UI, não posts)

As 6 sugestões abaixo são **telas interativas dentro da app**, não posts da comunidade. Quando quiser implementá-las, abrimos plano separado:

- Tela "Recomendação do concurso" com botões Fixar/Apoio/Excluir
- Ranking interativo clicável de duplas quentes/frias
- Painel histórico de fiéis/voláteis nas últimas N análises
- Painel "Como calculamos" embutido nas páginas de tendências
- Justificativas inline em cada dezena dos rankings
- Validações visíveis no UI dos rankings

## Garantias

- **Cenários determinísticos**: 3 jogos calculados por regra fixa, nunca pela IA.
- **Desaceleração real**: janela 5 vs 5 é matemática direta, sem inferência.
- **Como Calculamos**: 90% texto fixo, sem espaço para alucinação.
- **Anti-alucinação**: validador já existente cobre 01-25 e percentuais.
- **Encaixe na agenda**: 16h, 17h e 18h livres; 18h vira o último post antes do sorteio das 20h.
- **Estratégia editorial**: até 15h o usuário recebe **ferramenta**, depois das 16h recebe **transparência** — fideliza sem sobrecarregar com mais palpite.

