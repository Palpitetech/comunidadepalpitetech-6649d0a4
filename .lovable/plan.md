

## Refatoração: Aba "Por Usuário" — drill-down do que cada um gastou

### Diagnóstico (varredura completa)

A aba está **tecnicamente funcionando**: JOIN com `perfis` traz `nome`/`email` reais, agregado por `user_id` bate com o banco (testado com SQL):

| Nome | Chamadas | Tokens | USD |
|---|---|---|---|
| Augusto Honorato de Angelis | 118 | 192K | $0.084 |
| Alex Sandro Pereira da Silva | 69 | 98K | $0.025 |
| João Francisco Joaquim | 10 | 14K | $0.0037 |
| kelyton dourado | 4 | 5.8K | $0.0016 |
| Marcelo Dias ferreira | 4 | 4.4K | $0.0011 |
| Juracy de Abreu e Silva | 2 | 2.7K | $0.0007 |
| Maquilane Rodrigues Queiroz | 1 | 1.4K | $0.0004 |
| Arlo Carlos Almeida | 1 | 743 | $0.0001 |

**Problema**: a tabela é uma linha-única por usuário. Você não vê **em que ferramenta** cada um gastou. Por exemplo, o Augusto:
- 86 chamadas → Gerador Lotofácil ($0.0718)
- 16 chamadas → Chat IA ($0.0067)
- 10 chamadas → Gerador Quina ($0.0038)
- 4 chamadas → Auto-Preencher Fechamento ($0.0015)
- 2 chamadas → Resposta de Bot ($0.0003)

Hoje vira só "118 chamadas". Sem essa quebra, você não consegue responder "o Augusto está custando caro porque usa muito o gerador ou porque conversa muito no chat?"

### Mudanças

#### 1. Hook `useAiUsageLogs.ts` — nova quebra `byFerramenta` dentro de cada usuário

`byUsuario[user_id]` passa a ter:
```ts
{
  name, email, costUsd, tokens, count,
  byFerramenta: Record<string, { count, tokens, costUsd }>  // novo
}
```

Calculado no mesmo loop que já existe em `computeSummary` (sem custo extra de query).

#### 2. Aba "Por Usuário" vira **expansível**

Cada linha do usuário ganha um chevron à esquerda. Ao clicar, expande mostrando uma sub-tabela com **as ferramentas que ele usou**:

```
▼ Augusto Honorato de Angelis    augusto_h_@hotmail.com    118    192K    $0.0841    R$ 0.4878
   └─ Gerador Lotofácil                                      86    132K    $0.0718    R$ 0.4164
   └─ Chat IA                                                16     38K    $0.0067    R$ 0.0389
   └─ Gerador Quina                                          10     15K    $0.0038    R$ 0.0223
   └─ Auto-Preencher Fechamento Lotofácil                     4    5.8K    $0.0015    R$ 0.0086
   └─ Resposta de Bot (comentário)                            2    1.5K    $0.0003    R$ 0.0016

▶ Alex Sandro Pereira da Silva   alesaude@gmail.com         69    98K    $0.0252    R$ 0.1463
```

- Estado local `expandedUsers: Set<string>` controla quais estão abertos
- Sub-linha indentada com `pl-8` e `text-muted-foreground`
- Usa o mesmo `FUNCTION_LABELS` (rótulo curto, sem o "—" descritivo)
- Ordenação interna: por `costUsd desc` (ferramenta mais cara primeiro)

#### 3. Adicionar **3 colunas extras** na linha principal do usuário

Para responder "como esse usuário usa a plataforma?" sem precisar expandir:

| Nome | Email | **Ferramenta principal** | **Ferramentas usadas** | **Última atividade** | Chamadas | Tokens | USD | BRL |

- **Ferramenta principal**: a de maior `costUsd` (ex: "Gerador Lotofácil")
- **Ferramentas usadas**: contador (ex: "5 ferramentas")
- **Última atividade**: data do log mais recente daquele usuário (`MAX(created_at)`)

Isso permite bater o olho e ver: "Augusto usa 5 ferramentas diferentes, principalmente Gerador, ativo hoje".

### Detalhes técnicos

- **Sem nova query**: o agrupamento por ferramenta dentro de cada usuário sai do mesmo `for (const log of logs)` que já existe em `computeSummary`.
- **Última atividade**: armazena `lastActivity: string` no acumulador, atualiza com `Math.max` no timestamp.
- **Ordenação default**: usuários por `costUsd desc`.
- **`colSpan`** do empty state vai de 6 para 9.

### Arquivos editados

- `src/hooks/useAiUsageLogs.ts` — `UsageSummary.byUsuario[id]` ganha `byFerramenta` + `lastActivity`
- `src/pages/admin/AdminCustos.tsx` — aba "Por Usuário" expansível com sub-linhas + 3 colunas novas

### Resultado esperado

Você passa de **"Augusto custou $0.084"** para **"Augusto custou $0.084, principalmente no Gerador Lotofácil (86 chamadas), ativo hoje, usa 5 ferramentas — clique para ver detalhe"**.

Resposta direta às perguntas reais:
- "Quanto cada usuário me custa?" → linha principal
- "No quê ele gasta?" → expandir
- "Está ativo?" → coluna última atividade
- "Quem é power user?" → ordenação por custo + nº de ferramentas

### Fora de escopo

- Não cria CSV export
- Não cria gráfico de evolução por usuário
- Não muda outras abas (Por Origem, Por Ferramenta, Por Bot, Log Detalhado)
- Não cria limites/alertas por usuário

