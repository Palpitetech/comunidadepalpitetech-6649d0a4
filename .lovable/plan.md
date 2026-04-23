

## Refatoração total do motor `/gerador-estudo` — consistência + transparência

### Diagnóstico

O motor atual está praticamente "cego": o `fatos_snapshot.extras` salvo pela engine de Lotofácil só contém `{ totalCiclos? }`. Os arrays que o gerador espera (`moldura`, `quentes`, `frias`, `repetidas_recomendadas`, `dezenas_faltantes`, `dezenas_evitadas`) **nunca foram populados**. Resultado: a maioria dos estudos cai no `default` que sorteia do universo 1-25, sem nenhum vínculo real com o conteúdo do estudo. Por isso "falta consistência".

Além disso, o `EstrategiaCard` já suporta dezenas fixas/evitadas/filtros ricos, e o `ResultadosSheet` já aceita `dezenasFixes` para pintar de preto — mas o `GeradorEstudo.tsx` **não passa** essas dezenas fixas para o sheet.

### Arquitetura nova

```text
┌──────────────────────────────────────────────────────────────┐
│ generate-guide-post (já roda hoje)                           │
│   ├─ engine.montarFatos() → recomendações ricas              │
│   └─ NEW: engine.extrairBaseGeracao() → BaseGeracao salva    │
│      em fatos_snapshot.base_geracao (estrutura canônica)     │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ generate-palpites-from-estudo (REFATORADO 100%)              │
│   1. Lê post.fatos_snapshot.base_geracao                     │
│   2. Aplica regras determinísticas POR TEMA:                 │
│      ─ FIXAR (núcleo) → entra em TODOS os jogos              │
│      ─ APOIO          → entra em ≥X jogos                    │
│      ─ EXCLUIR        → fora de TODOS os jogos               │
│      ─ COMPLETAR      → universo restante                    │
│   3. Garante diversidade entre jogos (Hamming distance ≥3)   │
│   4. Monta EstrategiaData detalhada (fixas/evitadas/filtros) │
│   5. Humaniza só a `conclusao` via IA (timeout 4s)           │
│                              ↓                                │
│   GeradorEstudo.tsx passa `dezenasFixes` ao ResultadosSheet  │
│   → PalpiteCard pinta as fixas em preto                      │
└──────────────────────────────────────────────────────────────┘
```

### Estrutura canônica `BaseGeracao` (salva em `fatos_snapshot.base_geracao`)

```ts
interface BaseGeracao {
  tema: string;                    // analise_moldura, analise_repetidas, etc.
  fixar: number[];                 // núcleo — entra em 100% dos jogos
  apoio: number[];                 // entra em ≥60% dos jogos
  excluir: number[];               // 0% dos jogos
  ficar_de_olho?: number[];        // 1 ou 2 podem entrar como coringa
  ultimo_sorteio?: number[];       // p/ regra de "repetidas mín/máx"
  qtd_repetidas_alvo?: { min: number; max: number };
  qtd_moldura_alvo?: { min: number; max: number };
  observacao_principal: string;    // motivo humano da estratégia
}
```

### Mapeamento por tema (engine extrai dos `Recomendacao*` que já calcula)

| Tema | fixar | apoio | excluir | Filtros adicionais |
|---|---|---|---|---|
| `analise_moldura` | `nucleoForte` | `apoio` | `deixarFora` | `qtd_moldura_alvo` |
| `analise_movimentacao` | `fixar` (FIXAR) | `apoio` | `excluir` | `ficar_de_olho` como coringa |
| `analise_repetidas` | `repetirNucleo` | `repetirApoio` | `naoRepetir` | `qtd_repetidas_alvo: {min: rep.qtdRecomendada, max: rep.qtdRecomendada+2}` |
| `analise_ciclo` | `prioritarias` (faltantes) | — | `deixadasDeFora` | — |
| `analise_cenarios` | `equilibrado.repete` ∩ `equilibrado.novas` | resto do equilibrado | — | — |
| `analise_ficar_de_olho` | — | `topQuedas[0..1]` (manter atenção) | `topQuedas[última]` | — |
| `analise_linhas`/`colunas` | `nucleoFixas` | `apoio` | `evitar` | distribuição linha/coluna |
| `analise_posicoes_*` | trio recomendado | alternativas | evite | — |
| `analise_como_calculamos` | (sem regras de geração — bloqueia botão com aviso) | | | |

### Algoritmo determinístico (por jogo)

```text
Para cada jogo:
  1. dezenas = [...fixar]                      // sempre presentes
  2. excluir → marca proibido
  3. Sortear apoio até atingir cota mínima
     (cota = ceil((qtdDezenas - fixar.length) * 0.6))
  4. Completar universo (não-fixar, não-excluir, não-apoio-já-usado)
     até qtdDezenas
  5. Validar:
     - qtd_repetidas_alvo (se houver, conta ∩ ultimo_sorteio)
     - qtd_moldura_alvo (se houver)
     - se falhar, rerolar passo 4 até 50 tentativas
  6. Garantir diversidade vs jogos já gerados (Hamming ≥3)
```

### Transparência total na `EstrategiaData` retornada

```ts
{
  ferramentas: [
    "Análise da Moldura",
    `Estudo do concurso ${proximo}`,
    `Base ${ultimo} → ${proximo}`,
    "Motor determinístico v2"
  ],
  dezenas_fixas: [{
    dezenas: fixar,
    motivo: `Núcleo do estudo "Moldura": ${nucleoForteMotivoOriginal}. Entram em TODOS os ${quantidade} jogos.`
  }, {
    dezenas: apoio,
    motivo: `Apoio: cada jogo carrega pelo menos ${cotaApoio} destas.`
  }],
  dezenas_evitadas: [{
    dezenas: excluir,
    motivo: `Excluídas pelo estudo. NÃO aparecem em nenhum jogo.`
  }],
  filtros_aplicados: [
    { filtro: "Núcleo obrigatório", valor_alvo: `${fixar.length} dezenas em 100% dos jogos`, motivo: ... },
    { filtro: "Apoio mínimo", valor_alvo: `${cotaApoio}+ por jogo`, motivo: ... },
    { filtro: "Repetidas alvo", valor_alvo: `${min}-${max} repetidas do ${ultimo}`, motivo: ... },
    { filtro: "Diversidade entre jogos", valor_alvo: "Hamming ≥3", motivo: "Evita jogos quase iguais." }
  ],
  conclusao: humanizada(...)  // IA só polishe
}
```

### UI — Pintar fixas em preto nos cards

`src/pages/lotofacil/GeradorEstudo.tsx` passará `dezenasFixes={result.estrategia.dezenas_fixas?.[0]?.dezenas}` para `<ResultadosSheet>`. Já existe a pintura via `palpite-fixa` no `PalpiteCard`.

### Migração de estudos antigos (sem `base_geracao`)

Estudos antigos (gerados antes desta refatoração) **não terão** `base_geracao`. Para eles:
- O motor faz **fallback inline** rodando `engine.extrairBaseGeracao(snapshot)` no momento da geração, reconstruindo a partir de `recomendacao_direta`/`resumo` por regex/parsing dos blocos.
- Se nem isso der certo → erro 422 amigável: "Este estudo é da versão anterior. Selecione um estudo a partir de hoje."

### Arquivos tocados

| Arquivo | Ação |
|---|---|
| `supabase/functions/_shared/guide-post/types.ts` | Adicionar `BaseGeracao` + método `extrairBaseGeracao` opcional na interface `GuideEngine` |
| `supabase/functions/_shared/guide-post/lotofacil/engine.ts` | Implementar `extrairBaseGeracao(tipoPost, recomendacoes)` (~150 linhas, casos por tema) |
| `supabase/functions/generate-guide-post/index.ts` | Salvar `base_geracao` dentro de `fatos_snapshot` |
| `supabase/functions/generate-palpites-from-estudo/index.ts` | **Reescrita 100%**: novo pipeline determinístico + EstrategiaData rica + fallback de parsing |
| `src/pages/lotofacil/GeradorEstudo.tsx` | Passar `dezenasFixes` para `ResultadosSheet` |
| `supabase/functions/regenerate-base-geracao/index.ts` | **NOVA** — endpoint admin one-shot que recalcula `base_geracao` em todos os rascunhos/publicados de hoje (para hidratar estudos já gerados) |

### Garantias de consistência

- **Mesma `fixar`** em todos os jogos da mesma chamada → consistência intra-execução.
- **Mesma `BaseGeracao`** persistida no snapshot → consistência entre múltiplas chamadas do mesmo estudo.
- **Pintura preta** das fixas → usuário enxerga visualmente o que foi imposto.
- **Conclusão humanizada por IA** = só verniz; estratégia bruta é determinística e auditável.
- **Filtros declarados explicitamente** no card (núcleo / apoio / excluir / repetidas alvo / diversidade) → 100% transparente.

### Não-objetivos (fora do escopo)

- Mega-Sena: mantém estrutura atual (default). Será replicada quando engine megasena ganhar `extrairBaseGeracao`.
- Mudar UX do hub ou seletor.

