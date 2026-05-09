# Mega Sena Especial — Engine única + 15 estudos

## Princípio central

**Uma única engine determinística** (`src/lib/megaEspecialEngine.ts`) calcula tudo. Os slides de gravação e as tabelas do hub público importam **as mesmas funções**. A IA nunca calcula — recebe o JSON pronto da engine e apenas escreve frases.

```text
                resultados_loterias (megasena, 3.005 concursos)
                              │
                              ▼
                  useMegaEspecialBase()  (hook único, cache 1h)
                              │
                              ▼
              ┌──── megaEspecialEngine.ts ────┐
              │  • dezenas/linhas/colunas     │
              │  • quadrantes (4)             │
              │  • mini-quadrantes (16)       │
              │  • top N por filtro/período   │
              └──────────┬─────────┬──────────┘
                         │         │
                  ┌──────▼──┐   ┌──▼─────────┐
                  │ Slides  │   │ Tabelas    │
                  │ admin   │   │ /mega-30   │
                  └─────────┘   └────────────┘
                         ▲
                  ┌──────┴────────┐
                  │ IA (narrativa)│   ← recebe JSON, só escreve texto
                  └───────────────┘
```

## Identidade nova: "Mega 30 Anos"

Tratada como loteria visual separada (não toca na Mega-Sena normal):

- **Rota hub público:** `/mega-30` → `HubMega30Anos.tsx` (15 cards = 15 estudos)
- **Rota tabelas:** `/mega-30/estudo/:id` (1 página por estudo, com filtros)
- **Rota admin gravação:** `/admin/gravacao/mega-30-anos/:id` (já existe a primeira)
- **Tema visual:** verde escuro `#0A2818` + dourado `#D4AF37` + Cinzel (já em uso)
- **Source única:** todos os 3.005 concursos da Mega-Sena (tabela `resultados_loterias`)
- **Gating:** estudos atrás de feature `mega_30_anos` (admin bypass conforme padrão)

## Definição matemática única (trava de consistência)

Constantes e helpers ficam em `megaEspecialEngine.ts` e **substituem** qualquer cálculo solto:

### Quadrantes (4) — já definido em `src/lib/megasena.ts`
- Q1 superior-esquerdo, Q2 superior-direito, Q3 inferior-esquerdo, Q4 inferior-direito.

### Mini-quadrantes (16) — NOVO
Cada quadrante grande (15 dezenas, 3 linhas × 5 colunas) é dividido em 4 sub-blocos:

```text
Q1 (dezenas 01-05, 11-15, 21-25):
  MQ1.1 = {01,02, 11,12}         MQ1.2 = {03,04,05, 13,14,15}
  MQ1.3 = {21,22}                 MQ1.4 = {23,24,25}
```

**Regra geral** (aplicada a todos 4 quadrantes):
- Eixo horizontal divide em "esquerda 2 colunas" e "direita 3 colunas"
- Eixo vertical divide em "topo 2 linhas" e "base 1 linha"
- Total: **16 mini-quadrantes** com 2-6 dezenas cada

Função única: `getMiniQuadrante(dezena: number): number /* 1..16 */`

### Filtros disponíveis em todo estudo
Cada estudo aceita combinação de:
- **Período:** 30 anos / por ano / por mês / por semestre / Mega da Virada / aniversários
- **Agrupamento:** dezena / linha (6) / coluna (10) / quadrante (4) / mini-quadrante (16)
- **Top N:** 6, 10, 15

## Os 15 estudos (catálogo fechado)

| #  | Estudo                               | Agrupamento padrão | Filtros principais         |
|----|--------------------------------------|--------------------|----------------------------|
| 01 | Top 15 dezenas nos 30 anos           | dezena             | mês, ano, semestre, total  |
| 02 | Linhas mais sorteadas                | linha (6)          | ano, semestre, total       |
| 03 | Colunas mais sorteadas               | coluna (10)        | ano, semestre, total       |
| 04 | Quadrantes mais sorteados            | quadrante (4)      | ano, semestre, total       |
| 05 | Mini-quadrantes mais sorteados       | mini (16)          | ano, semestre, total       |
| 06 | Top dezenas por linha                | dezena × linha     | linha 1..6                 |
| 07 | Top dezenas por coluna               | dezena × coluna    | coluna 1..10               |
| 08 | Top dezenas por quadrante            | dezena × quadrante | quadrante 1..4             |
| 09 | Top dezenas por mini-quadrante       | dezena × mini      | mini 1..16                 |
| 10 | Pares × Ímpares ao longo dos anos    | paridade           | ano, total                 |
| 11 | Moldura × Centro                     | zona               | ano, total                 |
| 12 | Soma das dezenas (faixas)            | faixa de soma      | ano, total                 |
| 13 | Repetições do concurso anterior      | qtd repetidas      | ano, total                 |
| 14 | Sequências consecutivas              | qtd sequências     | ano, total                 |
| 15 | Mega da Virada — top dezenas         | dezena             | só concursos da virada     |

> Estudos 02-15 são placeholders de catálogo — a implementação faseada começa pelo 01 (já feito) e segue na ordem que você definir.

## IA: papel restrito a narrativa

- Camada nova: `src/lib/mega30/narrativa.ts`
- Recebe **somente** `EstudoResultado` (JSON da engine) e devolve string com 1-2 parágrafos.
- Edge function dedicada `mega30-narrativa` (Lovable AI gateway, `google/gemini-2.5-flash`).
- IA **proibida** de citar números que não estejam no JSON recebido (prompt trava isso).
- Cache do texto por chave `(estudoId + filtros)` em `localStorage` para zerar custo em re-render.

## Estrutura de arquivos

```text
src/lib/
  megaEspecialEngine.ts           ← núcleo: tipos + funções puras
  megaEspecialEngine.test.ts      ← testes unitários (vitest)
  mega30/
    narrativa.ts                  ← chamada à edge function
    estudosCatalog.ts             ← metadados dos 15 estudos

src/hooks/
  useMegaEspecialBase.ts          ← fetch único dos 3.005 concursos
  useEstudoMega30.ts              ← (estudoId, filtros) → resultado da engine

src/pages/mega30/
  HubMega30Anos.tsx               ← /mega-30
  EstudoMega30.tsx                ← /mega-30/estudo/:id
src/components/mega30/
  Mega30Theme.tsx
  TabelaTopDezenas.tsx
  TabelaTopLinhas.tsx
  TabelaTopColunas.tsx
  TabelaTopQuadrantes.tsx
  TabelaTopMiniQuadrantes.tsx
  FiltroPeriodo.tsx
  NarrativaIA.tsx

src/components/gravacao/mega30anos/estudoXX/
  ← cada slide importa engine + componentes de tabela acima

supabase/functions/mega30-narrativa/index.ts
```

## Garantias de consistência

1. **Zero duplicação:** slides e tabelas chamam `engine.calcularEstudo(id, filtros)`. Mesma entrada → mesma saída.
2. **Testes obrigatórios:** `megaEspecialEngine.test.ts` cobre cada um dos 15 estudos com snapshot de um período conhecido.
3. **Versão da engine:** constante `ENGINE_VERSION` exportada e exibida no rodapé dos slides + tabelas. Mudou versão → admin sabe que precisa re-gravar.
4. **IA não inventa:** narrativa recebe `{ ENGINE_VERSION, estudoId, filtros, resultado }` e o prompt instrui "use somente os números deste JSON".

## Escopo desta primeira entrega

Para não estourar a complexidade, esta entrega entrega:

1. **Engine completa** (`megaEspecialEngine.ts`) com todas as 15 definições + testes.
2. **Hub público** `/mega-30` com 15 cards (12 deles marcados "Em breve" se ainda sem UI).
3. **Tabelas dos estudos 01-05** (os 5 fundamentais: dezenas, linhas, colunas, quadrantes, mini-quadrantes).
4. **Refator do Estudo 01 já existente** para consumir a nova engine (remove cálculo duplicado em `useGravacaoMega30Anos.ts`).
5. **Edge function `mega30-narrativa`** + componente `NarrativaIA`.
6. **Registro no menu admin + rotas.**

Estudos 06-15 (slides e tabelas restantes) ficam para entregas seguintes — a engine já estará pronta para eles.

---

### Detalhes técnicos (para devs)

- `useMegaEspecialBase` faz paginação 1000 em 1000 (já existe padrão em `useGravacaoMega30Anos`).
- Tipos:
  ```ts
  type Agrupamento = 'dezena' | 'linha' | 'coluna' | 'quadrante' | 'mini';
  type Periodo = { tipo: 'total' | 'ano' | 'mes' | 'semestre' | 'virada'; valor?: number };
  interface EstudoResultado { estudoId: string; filtros: {...}; ranking: {chave: string|number; freq: number}[]; meta: {totalConcursos, periodoLabel, engineVersion} }
  ```
- Edge function `mega30-narrativa` segue padrão Lovable: CORS via `@supabase/supabase-js/cors`, validação Zod, chama `LOVABLE_API_KEY`, `verify_jwt = false` (default novo).
- Gating: nova feature key `mega_30_anos` em `src/lib/featureMap.ts` (só leitura no plano gratuito = bloqueado, mostra upsell). Admin bypass automático.
