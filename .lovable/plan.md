

## Posts da Mega-Sena com a estrutura modular

### Decisão de escopo: 7 tipos (não 11)

A Lotofácil tem 11 tipos porque sorteia 15/25 (60% do volante). A Mega sorteia 6/60 (10%) — alguns tipos perdem sentido estatístico. **Vou implementar os 7 mais valiosos:**

| Tipo | Mega? | Justificativa |
|---|---|---|
| `analise_movimentacao` (quentes/frias) | ✅ | Universal — só muda para 1-60. |
| `analise_moldura` | ✅ | Moldura Mega = 30 dezenas (1-10, 11/21/31/41, 20/30/40/50, 51-60). |
| `analise_repetidas` | ✅ | Adaptado: na Mega normalmente 0-1 repete; foco em coocorrência histórica e dezenas que mais repetem. |
| `analise_linhas` | ✅ | Grid 6×10 → 6 linhas, distribuição diferente da Lotofácil. |
| `analise_colunas` | ✅ | 10 colunas. |
| `analise_posicoes_iniciais` | ✅ | P1, P2, P3 das 6 ordenadas. |
| `analise_posicoes_finais` | ✅ | P4, P5, P6. |
| `analise_como_calculamos` | ✅ | Versão Mega da metodologia (transparência). |
| ~~`analise_ciclo`~~ | ❌ por ora | Mega não tem `ciclo_numero` populado no banco. Adicionar depois quando rodarmos backfill. |
| ~~`analise_cenarios`~~ | ❌ | Faz sentido na Lotofácil porque a faixa de repetição é o eixo central; na Mega esse eixo é fraco. |
| ~~`analise_ficar_de_olho`~~ | ❌ | Janela curta + 6 dezenas torna o sinal de "desaceleração" instável. |

Total: **8 tipos** ativos no lançamento. Os 3 restantes ficam fáceis de adicionar depois (mesmo padrão).

### Arquitetura — onde cada arquivo vive

```text
supabase/functions/_shared/guide-post/
├── lottery-configs.ts        ← adicionar entrada "megasena"
├── personas.ts               ← adicionar entrada "megasena" (mesmo Augusto)
├── index.ts                  ← registrar megasenaEngine no ENGINES{}
└── megasena/                 (NOVO)
    └── engine.ts             ← engine completo (~1500 linhas)
```

Engine Mega segue o **mesmo contrato `GuideEngine`** já usado pela Lotofácil — zero impacto no `generate-guide-post/index.ts` (router não muda).

### Conteúdo do `megasena/engine.ts`

Estrutura idêntica à Lotofácil, com substituições:

- **Constantes:** `TOTAL_DEZENAS=60`, `DEZENAS_POR_SORTEIO=6`, `PERIODO_ANALISE=20` (janela maior porque Mega é menos densa), `MOLDURA` com as 30 dezenas da Mega.
- **Helpers determinísticos:** `calcularFrequencias`, `topQuentes`, `topFrias`, `analisarRepetidasDetalhado` (adaptado: fala em "quantas vezes a dezena X do último sorteio voltou em algum dos próximos 10 sorteios", não em "quantas repetem por concurso"), `analisarMolduraDetalhado` (30 dezenas, faixa típica 2-4 por sorteio), `analisarEixoDetalhado` (6 linhas / 10 colunas), `analisarPosicoes` (P1-P3 e P4-P6).
- **Persona:** mesmo system prompt do Augusto (já vem do `personas.ts`).
- **Títulos determinísticos:** `🔥❄️ Quentes e Frias da Mega-Sena — Concurso N`, `🖼️ Moldura da Mega-Sena — N`, etc.
- **Whitelist anti-alucinação:** dezenas 1-60 + concursos da janela + percentuais 0-100.
- **Limites de conteúdo:** mesmo esquema da Lotofácil (1500-2200 chars).
- **Fallback determinístico:** mesma lógica.

### Atualizações nos arquivos compartilhados

**`personas.ts`** — adiciona Mega usando o mesmo Augusto:
```ts
megasena: {
  perfil_id: "41b58d48-2ef1-4bf7-a536-ed8a49607fa9",
  nome: "Augusto Angelis",
  system_prompt: `Você é Augusto Angelis, especialista em loterias da equipe
Palpite Tech. Para Mega-Sena fale com tom acolhedor, em primeira pessoa, sem
mencionar IA/bot/modelo. Mega tem 60 dezenas e sorteia 6 — repetições são raras.`,
}
```

> ⚠️ Atenção dedup: como Augusto é a mesma persona em duas loterias, o lock atual de "1 post por persona+tipo+dia" passa a ser "1 post por persona+tipo+**loteria**+dia". Isso evita que Mega bloqueie Lotofácil quando ambas têm `analise_movimentacao` no mesmo dia. **Plano:** em `generate-guide-post/index.ts`, incluir filtro adicional `loteria_tag = config.loteria_tag` na query de dedup. Mudança cirúrgica de 1 linha.

**`lottery-configs.ts`** — adiciona Mega:
```ts
megasena: {
  loteria: "megasena",
  loteria_tag: "Mega-Sena",
  total_dezenas: 60,
  dezenas_por_sorteio: 6,
  periodo_analise: 20,
}
```

**`_shared/guide-post/index.ts`** — registra engine:
```ts
import { megasenaEngine } from "./megasena/engine.ts";
export const ENGINES = { lotofacil: lotofacilEngine, megasena: megasenaEngine };
```

### Migration: atualizar trigger de validação

A função `validate_post_schedule` precisa aceitar `megasena` + os 8 tipos novos:

```sql
loterias_validas text[] := ARRAY['lotofacil', 'megasena'];
tipos_megasena   text[] := ARRAY[
  'analise_movimentacao','analise_moldura','analise_repetidas',
  'analise_linhas','analise_colunas','analise_posicoes_iniciais',
  'analise_posicoes_finais','analise_como_calculamos'
];
-- + CASE WHEN 'megasena' THEN tipos_megasena ...
```

### Schedules da Mega-Sena (insert via tool)

Mega sorteia **terça (2), quinta (4) e sábado (6)**, mas o conteúdo educacional pode rodar todos os dias para alimentar o filtro novo do dashboard "Estudos". Decisão recomendada: **rodar diariamente** (consistente com Lotofácil), porque o objetivo é estudo, não previsão de sorteio iminente.

Horários propostos (não colidem com Lotofácil):

| Tipo | Horário | Dias |
|---|---|---|
| `analise_movimentacao` | 09:30 | todos |
| `analise_moldura` | 10:30 | todos |
| `analise_repetidas` | 11:30 | todos |
| `analise_linhas` | 12:30 | todos |
| `analise_colunas` | 13:30 | todos |
| `analise_posicoes_iniciais` | 14:30 | todos |
| `analise_posicoes_finais` | 15:30 | todos |
| `analise_como_calculamos` | 19:30 | todos |

8 schedules × 1 post/dia = 8 posts/dia da Mega. Lotofácil continua com 11 posts/dia. Total: 19 posts/dia.

### Verificação (após implementação)

1. **Trigger:** tentar inserir schedule `loteria='megasena', tipo_post='analise_movimentacao'` → ✅ sucesso. Tentar `tipo_post='analise_ciclo'` → ❌ erro (esperado).
2. **Edge function manual:** `curl_edge_functions` em `generate-guide-post` com `{ tipo_post: 'analise_movimentacao', loteria: 'megasena' }` → post criado com `loteria_tag='Mega-Sena'`, autor Augusto, dezenas 1-60.
3. **Dedup cross-lottery:** chamar 2x seguidos a mesma loteria/tipo → 2º responde `skipped`. Chamar Mega + Lotofácil mesmo tipo → ambos passam.
4. **Frontend filtro:** trocar para "Mega-Sena" no dashboard Estudos → posts aparecem.
5. **Cron real:** esperar próximo horário cheio Mega (ex.: 09:30) → log mostra `loteria=megasena`, post inserido.
6. **Anti-alucinação:** validar que conteúdo gerado pela IA não cita números fora de 1-60.
7. **Whitelist números:** se IA inventar dezena 65 → fallback determinístico ativa.

### Garantias de estabilidade

| Risco | Mitigação |
|---|---|
| Engine Mega quebrar Lotofácil | Engines são módulos isolados; router só seleciona um por requisição. Nenhum import cruzado. |
| Dedup misturar Lotofácil e Mega (mesmo Augusto) | Adicionar `loteria_tag` no filtro de dedup (1 linha em `generate-guide-post/index.ts`). |
| Mega sem `ciclo_numero` quebrar engine | Tipo `analise_ciclo` não cadastrado em `tiposSuportados()` da Mega → trigger barra antes; edge retorna 400 se chamado direto. |
| Schedule Mega disparar fora dos dias de sorteio | Por design escolhemos rodar diariamente (conteúdo educacional). Quem quiser restringir, basta editar `dias` no schedule. |
| Custo de IA dobrar | Lotofácil 11 + Mega 8 = 19 posts/dia. Cada post ~$0.001 → custo total ~$0.02/dia. Negligível. |
| Tipo `analise_repetidas` enganar usuário (Mega quase nunca repete) | Texto muda foco: "no histórico das últimas 20 rodadas, **X** foi a dezena que mais voltou de uma rodada para outra (Y vezes)" — sinaliza claramente que repetição na Mega é rara. |

### Não inclui (escopo separado, se quiser depois)

- Backfill de `ciclo_numero` da Mega (necessário para reativar `analise_ciclo`).
- Tipos `analise_cenarios` e `analise_ficar_de_olho` para Mega (estatisticamente fracos com 6 dezenas).
- Persona dedicada para Mega (Augusto cobre por enquanto, conforme você pediu).
- Adaptação para outras loterias (Quina, Dupla Sena) — mesmo padrão, repetível.
- Tipo `analise_primos` ou `analise_fibonacci` específicos da Mega (podem entrar como expansão futura).

