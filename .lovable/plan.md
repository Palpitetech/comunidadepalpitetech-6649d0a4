

## Fase 3 — Centralização total do pipeline de geração

### Objetivo
Os 4 endpoints tradicionais (`/gerador`, `/gerador-megasena`, `/gerador-quina`, `/gerador-duplasena`) passam a usar o **mesmo motor determinístico** que `/gerador-estudo` já usa: `gerarJogo`, `validate-jogo`, `strategy-builder`.

### Arquitetura final

```text
_shared/gerador/
├── lottery-config.ts        ✅ já existe
├── validate-jogo.ts         ✅ já existe (gerarJogo + Hamming + filtros)
├── strategy-builder.ts      ✅ já existe (EstrategiaData + humanização)
├── auth-and-quota.ts        ✅ já existe
├── stats.ts                 ✅ já existe
├── ai-call.ts               ✅ já existe
├── base-from-stats.ts       ✅ já existe (estatísticas → BaseGeracao)
├── pedido-especial-parser.ts 🆕 IA traduz texto livre → ajustes em BaseGeracao
└── pipeline.ts              🆕 orquestrador único: stats → base → filtros → jogos → estratégia

generate-palpites/index.ts            🔄 wrapper ~80 LOC (lotofacil)
generate-palpites-megasena/index.ts   🔄 wrapper ~80 LOC
generate-palpites-quina/index.ts      🔄 wrapper ~80 LOC
generate-palpites-duplasena/index.ts  🔄 wrapper ~80 LOC
generate-palpites-from-estudo/index.ts ✅ já usa shared
```

### Pipeline único (`pipeline.ts`)

```ts
export async function gerarPalpitesDeterministicos(input: {
  loteria: 'lotofacil' | 'megasena' | 'quina' | 'duplasena';
  quantidade: number;
  qtdDezenas: number;
  periodoAnalise: number;
  filtros: { dezenasFixas?: number[]; dezenasExcluidas?: number[]; pedidoEspecial?: string };
  baseDoEstudo?: BaseGeracao; // opcional — quando vier de /gerador-estudo
  userId: string | null;
}): Promise<{ jogos: number[][]; estrategia: EstrategiaData }>
```

Fluxo interno:
1. `getLotteryConfig(loteria)` → constantes
2. `fetchUltimosResultados(...)` → estatísticas
3. Se `baseDoEstudo` → usa direto. Senão → `montarBaseDeStats(stats)` (quentes/frias/ciclo/repetidas)
4. Se tem `pedidoEspecial` → `parsePedidoEspecial(texto)` (IA curta) ajusta `BaseGeracao`
5. `aplicarFiltrosUsuario(base, filtros)` → mescla com prioridade
6. `gerarLote(base, qtdDezenas, quantidade)` → motor determinístico
7. `montarEstrategia(...)` + `humanizarConclusao(...)` (opcional)
8. `logUsoIa(...)` se IA foi chamada

### Wrappers (exemplo `/gerador`)

```ts
// generate-palpites/index.ts (~80 LOC)
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  
  const { user, isAdmin, quota } = await checkAuthAndQuota(req, 'lotofacil');
  if (quota.exceeded) return resp429(quota);
  
  const body = await req.json();
  const result = await gerarPalpitesDeterministicos({
    loteria: 'lotofacil',
    quantidade: body.quantidade,
    qtdDezenas: body.qtdDezenas ?? 15,
    periodoAnalise: body.periodoAnalise ?? 50,
    filtros: {
      dezenasFixas: body.dezenasFiexas,
      dezenasExcluidas: body.dezenasExcluidas,
      pedidoEspecial: body.pedidoEspecial,
    },
    userId: user.id,
  });
  
  await incrementQuota(user.id, 'lotofacil');
  return respOK({ ...result, remaining_today: quota.remaining - 1, max_per_day: quota.max });
});
```

### Tratamento do `pedidoEspecial` (mitiga regressão de UX)

`parsePedidoEspecial(texto)` faz uma chamada IA **curta e específica** (timeout 3s, fallback silencioso) que retorna ajustes estruturados:

```json
{ "preferenciaPares": "alta", "preferenciaSoma": { "min": 180, "max": 220 }, "extraExcluir": [13] }
```

Esses ajustes viram filtros adicionais aplicados ao `gerarJogo`. Se a IA falhar/timeout, o pedido vira só um label no card ("Pedido considerado: <texto>") — mesma UX de hoje no estudo.

### Testes Deno (mitiga single point of failure)

```text
_shared/gerador/__tests__/
├── validate-jogo.test.ts   → fixar/excluir/Hamming/repetidas/moldura
├── base-from-stats.test.ts → estatísticas → BaseGeracao por loteria
└── pipeline.test.ts        → fluxo end-to-end mockado por loteria
```

Rodar via `supabase--test_edge_functions` antes de cada deploy.

### Migração gradual (mitiga risco de quebra)

| Etapa | Deploy | Validação |
|---|---|---|
| 1 | Criar `pipeline.ts` + `pedido-especial-parser.ts` + testes | Tests verdes |
| 2 | Migrar `generate-palpites` (lotofacil) | Testar `/gerador` UI; comparar shape `EstrategiaData` |
| 3 | Migrar `generate-palpites-megasena` | Testar `/megasena/gerador` UI |
| 4 | Migrar `generate-palpites-quina` | Testar `/quina/gerador` UI |
| 5 | Migrar `generate-palpites-duplasena` | Testar `/duplasena/gerador` UI |

Cada etapa é deploy independente. Se UI quebrar, rollback é trivial (reverter o wrapper).

### Garantias

- **Mesmo `gerarJogo`** em todos os 5 endpoints (estudo + 4 tradicionais).
- **Mesmo `EstrategiaData`** rico e auditável.
- **Mesma RPC atômica** de quota (criar `incrementar_uso_gerador` se ainda não existir para os 4 tradicionais).
- **Mesmos `ai_usage_logs`** com `edge_function` discriminando origem.
- **`pedidoEspecial` preservado** via parser IA → `BaseGeracao`.

### Não-objetivos

- Mexer em UI dos geradores (cards já leem o shape correto).
- Tocar `_shared/guide-post`.
- Mudar limites/planos.

### Arquivos tocados

| Ação | Arquivo |
|---|---|
| Criar | `_shared/gerador/pipeline.ts` |
| Criar | `_shared/gerador/pedido-especial-parser.ts` |
| Criar | `_shared/gerador/__tests__/validate-jogo.test.ts` |
| Criar | `_shared/gerador/__tests__/base-from-stats.test.ts` |
| Criar | `_shared/gerador/__tests__/pipeline.test.ts` |
| Reescrever | `generate-palpites/index.ts` (~80 LOC) |
| Reescrever | `generate-palpites-megasena/index.ts` (~80 LOC) |
| Reescrever | `generate-palpites-quina/index.ts` (~80 LOC) |
| Reescrever | `generate-palpites-duplasena/index.ts` (~80 LOC) |
| Migration (se preciso) | RPC `incrementar_uso_gerador` atômica |

