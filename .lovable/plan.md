

## Refatoração modular: configs + personas por loteria

### Diagnóstico atual

`generate-guide-post/index.ts` tem **2616 linhas** 100% acopladas à Lotofácil:
- Constantes hardcoded: `TOTAL_DEZENAS=25`, `DEZENAS_POR_SORTEIO=15`, `MOLDURA` 5×5, `loteria: "lotofacil"` na query.
- Persona hardcoded: `AUGUSTO_PERFIL_ID`, `AUGUSTO_NOME`, `SYSTEM_PROMPT_BASE`.
- 11 tipos de post (`analise_ciclo`, `analise_moldura`, etc.) misturados num único `switch` gigante (linhas 1837–2263).
- `loteria_tag: "Lotofácil"` cravado no INSERT.
- `post_schedules` já tem coluna `loteria`, mas o código ignora.
- Nenhuma tabela `guide_personas` existe — tudo é constante TS.

**Resultado:** adicionar Mega-Sena exigiria copiar o arquivo inteiro. Não escala.

### Estratégia: estabilidade primeiro, escala depois

A refatoração é feita em **3 fases isoladas**, cada uma com verificação que confirma "Lotofácil continua funcionando 100% igual" antes da próxima. Nenhuma fase quebra produção sozinha — todas são aditivas até a última.

---

### FASE 1 — Extrair config + persona da Lotofácil (sem mudar comportamento)

**Objetivo:** isolar tudo que é "Lotofácil" em módulos dedicados, mantendo o `index.ts` chamando esses módulos. Resultado idêntico ao atual.

#### 1.1 Estrutura nova de pastas

```text
supabase/functions/
├── _shared/
│   └── guide-post/                        (NOVO)
│       ├── types.ts                       (Concurso, CicloHistorico, IndicadoresFatos)
│       ├── personas.ts                    (mapa loteria → persona)
│       ├── lottery-configs.ts             (mapa loteria → config numérica)
│       ├── ai-runner.ts                   (chamarIAComRetry + sanitizar + fallbackConteudo)
│       └── lotofacil/
│           ├── index.ts                   (export montarFatos, montarPrompt, montarTitulo, extrairNumerosPermitidos, validar)
│           ├── helpers.ts                 (calcularFrequencias, topQuentes, topFrias, MOLDURA…)
│           ├── analises.ts                (todas as analisar*Detalhado)
│           ├── prompts.ts                 (regras "REPRODUZA LITERALMENTE" por tipo)
│           └── titulos.ts                 (mapa tipo → título base)
└── generate-guide-post/
    └── index.ts                           (~120 linhas — só HTTP + orquestração)
```

#### 1.2 Conteúdo dos módulos

**`_shared/guide-post/personas.ts`**
```ts
export interface Persona {
  perfil_id: string;
  nome: string;
  system_prompt: string;
}
export const PERSONAS: Record<string, Persona> = {
  lotofacil: {
    perfil_id: "41b58d48-2ef1-4bf7-a536-ed8a49607fa9",
    nome: "Augusto Angelis",
    system_prompt: `Você é Augusto Angelis, especialista em Lotofácil...`,
  },
};
export function getPersona(loteria: string): Persona { /* throw se faltar */ }
```

**`_shared/guide-post/lottery-configs.ts`**
```ts
export interface LotteryConfig {
  loteria: string;            // "lotofacil"
  loteria_tag: string;         // "Lotofácil"
  total_dezenas: number;       // 25
  dezenas_por_sorteio: number; // 15
  periodo_analise: number;     // 10
  moldura: number[];
  // limites de conteúdo por tipo de post (substitui o ternário gigante)
  limites_conteudo: Record<string, number>;
}
export const LOTTERY_CONFIGS: Record<string, LotteryConfig> = {
  lotofacil: { /* valores atuais extraídos do index.ts */ },
};
export function getConfig(loteria: string): LotteryConfig { /* throw */ }
```

**`_shared/guide-post/lotofacil/index.ts`** — fachada única que o `generate-guide-post` consome:
```ts
export interface GuideEngine {
  montarFatos(concursos, historicoCiclos?, tipoPost): { resumo, recomendacaoDireta, extras };
  montarPrompt(tipoPost, fatos, ultimoConcurso, config): string;
  montarTituloDeterministico(tipoPost, proxConcurso): string;
  extrairNumerosPermitidos(concursos, proxConcurso, extras): Set<number>;
  validarConteudoNumerico(texto, permitidos): { ok, motivo? };
  fallbackConteudo(fatos): string;
  tiposSuportados(): string[];   // os 11 tipos atuais
}
export const lotofacilEngine: GuideEngine = { /* delega para helpers/analises/prompts/titulos */ };
```

**`_shared/guide-post/index.ts`** (registry):
```ts
import { lotofacilEngine } from "./lotofacil/index.ts";
export const ENGINES: Record<string, GuideEngine> = {
  lotofacil: lotofacilEngine,
};
export function getEngine(loteria: string): GuideEngine { /* throw */ }
```

#### 1.3 `generate-guide-post/index.ts` final (~120 linhas)

```ts
serve(async (req) => {
  // CORS, parse body
  const { tipo_post, loteria = "lotofacil" } = body;

  const config  = getConfig(loteria);
  const persona = getPersona(loteria);
  const engine  = getEngine(loteria);

  if (!engine.tiposSuportados().includes(tipo_post)) {
    return jsonError(400, `Tipo ${tipo_post} não suportado para ${loteria}`);
  }

  // Dedup BRT por (persona, tipo, dia)  ← idêntico ao atual
  // Buscar últimos N concursos de `config.loteria`
  // Calcular fatos via engine
  // Chamar IA com persona.system_prompt
  // Validar via engine
  // Inserir post (user_id = persona.perfil_id, loteria_tag = config.loteria_tag)
});
```

#### 1.4 Verificação Fase 1

1. Deploy da edge.
2. `curl_edge_functions` chamando `tipo_post: "analise_ciclo"` (sem `loteria`) e comparar com último post real do dia anterior — texto/estrutura idênticos.
3. Repetir para 3 tipos representativos: `analise_repetidas`, `analise_moldura`, `analise_posicoes_iniciais`.
4. Conferir nos logs: `[generate-guide-post] tipo=X loteria=lotofacil` aparece corretamente.
5. Esperar 1 ciclo de cron real (`process-scheduled-posts` no horário cheio) e validar que o post foi criado.

**Critério de aceite:** zero diferença visual/estrutural nos posts. Se aparecer qualquer divergência, rollback de 1 commit.

---

### FASE 2 — Permitir loteria no schedule + propagar até a edge

**Objetivo:** começar a usar a coluna `loteria` que já existe em `post_schedules` (hoje ignorada).

#### 2.1 `process-scheduled-posts/index.ts`

Trocar o POST para `generate-guide-post`:
```ts
body: JSON.stringify({ tipo_post: sched.tipo_post, loteria: sched.loteria }),
```
Atualizar dedup de 30min para incluir `loteria` (`generate-guide-post` continua filtrando por persona, mas o pré-filtro do scheduler também precisa).

#### 2.2 Verificação Fase 2

1. Forçar `process-scheduled-posts` com `testTime` simulando horário de Lotofácil.
2. Validar que a loteria chega corretamente na edge (log `loteria=lotofacil`).
3. Confirmar que os 11 schedules atuais continuam sendo despachados sem mudança visível.

---

### FASE 3 — Adicionar uma nova loteria (template Mega-Sena)

**Objetivo:** provar que a arquitetura permite adicionar loteria sem tocar em código compartilhado.

#### 3.1 Migration: cadastrar persona na tabela `perfis`

Criar (manualmente via insert tool) o perfil-bot da Mega-Sena (ex.: "Marcos Vieira") com avatar próprio. Anotar o `perfil_id` para o módulo de personas.

#### 3.2 Adicionar config + engine da Mega-Sena

```text
_shared/guide-post/megasena/
├── index.ts        (megasenaEngine)
├── helpers.ts      (usa src/lib/megasena.ts via cópia/import compatível com Deno)
├── analises.ts     (versões adaptadas a 60 dezenas / 6 sorteadas)
├── prompts.ts
└── titulos.ts
```

Atualizações:
- `lottery-configs.ts`: adicionar entrada `megasena` (60 dezenas, 6 por sorteio, moldura 60).
- `personas.ts`: adicionar entrada `megasena` com `perfil_id` criado em 3.1.
- `_shared/guide-post/index.ts`: registrar `megasenaEngine`.

**Escopo inicial Mega-Sena:** só 3 tipos para começar (`analise_movimentacao`, `analise_repetidas`, `analise_moldura`) — os mais transversais. Outros tipos podem ser adicionados depois sem refatoração.

#### 3.3 Cadastrar schedules de Mega-Sena

Insert tool em `post_schedules`:
- Mega-Sena sorteia ter/qui/sáb → `dias = {2,4,6}` por enquanto (ou diariamente para conteúdo educacional).
- 3 horários iniciais (ex.: 09:30, 14:30, 19:30) para não colidir com Lotofácil.

#### 3.4 Verificação Fase 3

1. Chamar manualmente `generate-guide-post` com `{ tipo_post: "analise_movimentacao", loteria: "megasena" }`.
2. Validar: post criado com `user_id = persona Mega-Sena`, `loteria_tag = "Mega-Sena"`, conteúdo coerente com dezenas 1–60.
3. Forçar `process-scheduled-posts` com `testTime` no horário Mega-Sena.
4. Confirmar que dedup BRT funciona isolado por persona (Mega-Sena pode postar mesmo se Augusto já postou no mesmo horário).
5. Verificar feed da comunidade: posts dos dois autores aparecem com avatares e tags corretos.

---

### Garantias de estabilidade

| Risco | Mitigação |
|---|---|
| Quebrar Lotofácil durante extração | Fase 1 é só "mover código" — mesmos cálculos, mesmos prompts, mesmos limites; testes comparam outputs antes/depois. |
| Engine ausente para uma loteria do schedule | `getEngine()` lança erro claro; `process-scheduled-posts` já tem `try/catch` por schedule (não causa dominó). |
| Tipo de post inexistente para a loteria nova | `engine.tiposSuportados()` valida antes de gerar; retorna 400 sem custo de IA. |
| Persona faltando | `getPersona()` lança erro; o cron não derruba os outros schedules (isolamento já existe). |
| Dedup colidindo entre loterias | Dedup é por `(user_id=persona, tipo, dia)` — naturalmente isolado quando personas são distintas. |
| Custo de IA explodindo com novas loterias | Cada engine controla seu próprio prompt; custo logado em `ai_usage_logs` com `metadata.loteria` para monitorar. |

### O que NÃO entra neste plano (pode vir depois)

- Migrar personas/configs para tabelas no banco (hoje ficam em código TS — mais simples e versionado).
- Adicionar Quina, Dupla Sena, Lotomania, Dia de Sorte (mesmo padrão da Mega-Sena, repetível).
- Editor visual de prompts no admin.
- Testes Deno automatizados (recomendado depois da Fase 1 estabilizar).

### Checkpoints de aprovação

Posso parar entre fases para você validar antes de seguir:
- **Após Fase 1:** "Lotofácil continua igual?" → ok → segue.
- **Após Fase 2:** "Schedule respeitando loteria?" → ok → segue.
- **Após Fase 3:** "Mega-Sena postando bem?" → ok → fim.

Se preferir, executo as 3 fases em sequência sem pausas.

