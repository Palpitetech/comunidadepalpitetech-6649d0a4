

## Auditoria: motor `/gerador-estudo` vs `/gerador` + Plano de centralização

### Veredito da varredura

O motor **`/gerador-estudo` (V2 determinístico) ficou MELHOR que o `/gerador` tradicional** em quase todos os eixos críticos:

| Eixo | /gerador (atual) | /gerador-estudo V2 | Vencedor |
|---|---|---|---|
| Reprodutibilidade | IA pode variar | 100% determinístico + IA só no verniz | **Estudo** |
| Auditabilidade | Estratégia vinda da IA (campos opcionais) | `EstrategiaData` tipada e construída no código | **Estudo** |
| Diversidade entre jogos | Só pede no prompt | Hamming ≥3 garantido por código | **Estudo** |
| Validação de filtros (fixar/excluir) | Pós-processamento "completa o que faltar" | Validação atômica por jogo + retries | **Estudo** |
| Custo por geração | 1 chamada IA cheia | 1 chamada IA curta (4s timeout, fallback) | **Estudo** |
| Branding ("não falar de IA") | Prompt diz "Você é especialista" | Já neutro | **Estudo** |
| Quota | `upsert` manual (race condition) | RPC atômica `incrementar_uso_gerador_estudo` | **Estudo** |
| Logs `ai_usage_logs` | ✅ | ❌ falta | **/gerador** |
| Filtros do usuário (fixas/excluir/pedido) | ✅ | ❌ só usa o do estudo | **/gerador** |
| Multi-loteria | 4 arquivos quase idênticos (~1900 LOC) | 1 arquivo com `cfg` por loteria | **Estudo** |

### O que falta no /gerador-estudo (gaps frente ao /gerador)

1. **Filtros do usuário** (`dezenasFiexas`, `dezenasExcluidas`, `pedidoEspecial`) — hoje o estudo não aceita.
2. **Logs em `ai_usage_logs`** para a chamada de humanização.
3. **Suporte a Quina e Dupla Sena** (hoje só lotofacil + megasena).

### O que está duplicado e precisa centralizar

Os 4 motores tradicionais (`generate-palpites`, `generate-palpites-megasena`, `generate-palpites-quina`, `generate-palpites-duplasena`) somam ~1900 linhas com ~80% de código repetido:
- Auth + admin check + perfil + plano + quota
- Estatísticas (frequências, médias, ciclo)
- Tool-call + estratégia + validação

### Arquitetura alvo

```text
supabase/functions/_shared/gerador/
├── lottery-config.ts        ← cfg por loteria (total, dezenas, moldura, primos, RPC quota)
├── auth-and-quota.ts        ← extrai usuário + admin + plano + quota (1 chamada)
├── stats.ts                 ← frequências, médias, ciclo, repetidas
├── ai-call.ts               ← chamada IA + log ai_usage_logs + cost estimate
├── validate-jogo.ts         ← gerarJogo determinístico (compartilhado entre /gerador e /estudo)
├── strategy-builder.ts      ← montarEstrategia + humanizarConclusao (do V2)
└── types.ts                 ← EstrategiaData, FiltrosUsuario, BaseGeracao (re-exporta)

supabase/functions/_shared/guide-post/
└── ... (já existe, intocado)
```

### Plano de execução em 3 fases

**Fase 1 — Centralizar primitivas** (não muda comportamento)
- Criar `_shared/gerador/lottery-config.ts` com `LOTTERY_CONFIG = { lotofacil, megasena, quina, duplasena }`.
- Extrair `auth-and-quota.ts`, `stats.ts`, `ai-call.ts` (com `ai_usage_logs`).
- Extrair `validate-jogo.ts` reutilizando o `gerarJogo` do estudo (já é o melhor).

**Fase 2 — Refatorar /gerador-estudo para usar shared + adicionar gaps**
- Substituir `TOTAL_BY_LOTERIA` local por import de `lottery-config.ts`.
- Aceitar `dezenasFiexas`/`dezenasExcluidas`/`pedidoEspecial` (mesclar com `BaseGeracao` do estudo: usuário tem prioridade sobre apoio, mas não sobre fixar do estudo — mostrar conflito no card).
- Adicionar log em `ai_usage_logs` na humanização.

**Fase 3 — Reescrever os 4 /gerador-* sobre o motor determinístico**
- Converter cada motor tradicional para construir uma `BaseGeracao` "ad-hoc" a partir das estatísticas (frequências → quentes/frias, ciclo → faltantes, repetidas).
- Pipeline final único: `montarBaseGeracaoEstatistica(stats, filtrosUsuario)` → `gerarJogo` (mesmo motor) → `montarEstrategia` (mesmo builder).
- IA passa a ser opcional (só humanização da conclusão), reduzindo custo em ~70% e eliminando alucinação de campos.
- Os 4 endpoints viram thin wrappers (~80 LOC cada) chamando o pipeline shared.

### Garantias de consistência multi-loteria

- **Mesmo algoritmo** (`gerarJogo` com Hamming ≥3) em todas as loterias e em ambos os motores.
- **Mesma `EstrategiaData`** rica e auditável em toda saída.
- **Mesma quota atômica** (RPC) para todos os motores.
- **Mesmo log** em `ai_usage_logs` quando IA for usada.
- **Mesmo branding** (sem menções a IA no texto exibido).

### Não-objetivos (escopo separado)

- Mudar UI dos geradores — somente a estratégia exibida fica mais rica.
- Tocar no engine de posts-guia (`_shared/guide-post`) — fica isolado.
- Migrar bancos/RPCs existentes — `incrementar_uso_gerador_estudo` continua ativa; criamos análoga `incrementar_uso_gerador` se hoje não existir atômica para `/gerador`.

### Arquivos a tocar

| Ação | Arquivo |
|---|---|
| Criar | `_shared/gerador/lottery-config.ts` |
| Criar | `_shared/gerador/auth-and-quota.ts` |
| Criar | `_shared/gerador/stats.ts` |
| Criar | `_shared/gerador/ai-call.ts` |
| Criar | `_shared/gerador/validate-jogo.ts` (extraído do estudo V2) |
| Criar | `_shared/gerador/strategy-builder.ts` (extraído do estudo V2) |
| Editar | `generate-palpites-from-estudo/index.ts` (usar shared + filtros usuário + log IA) |
| Reescrever | `generate-palpites/index.ts` (lotofacil → motor determinístico) |
| Reescrever | `generate-palpites-megasena/index.ts` |
| Reescrever | `generate-palpites-quina/index.ts` |
| Reescrever | `generate-palpites-duplasena/index.ts` |
| Migration (se preciso) | RPC `incrementar_uso_gerador` atômica para os 4 geradores tradicionais |

### Risco e mitigação

| Risco | Mitigação |
|---|---|
| Quebrar UI de algum gerador (formato `EstrategiaData`) | `EstrategiaCard*` já lê o mesmo shape; testar Lotofácil/Mega/Quina/Dupla após cada migração |
| Usuário sem plano cair em fluxo errado | Manter mesma resposta 403 / 429 que cada motor já retorna hoje |
| Geração ficar pior sem IA | IA continua disponível (humanização) + algoritmo determinístico já carrega "quentes/frias/ciclo/repetidas" como núcleo |
| Migração grande de uma vez | Fases 1 → 2 → 3 são independentes; cada uma é deploy isolado |

