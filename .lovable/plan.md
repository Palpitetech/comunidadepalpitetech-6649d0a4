# Aula 04 — Top dezenas PRIMAS da Mega-Sena

Mesma fórmula visual e técnica das Aulas 02 e 03, agora filtrando apenas **números primos** dentro do universo 1–60.

## 1. Mapeamento dos primos no volante

Universo de primos da Mega-Sena (já definido em `src/lib/megasena.ts` → `PRIMOS_MEGASENA`):
**2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59 → 17 primos no total.**

### Por LINHA (6 linhas)
| Linha | Primos | Qtd |
|---|---|---|
| L1 (01–10) | 2, 3, 5, 7 | 4 |
| L2 (11–20) | 11, 13, 17, 19 | 4 |
| L3 (21–30) | 23, 29 | 2 |
| L4 (31–40) | 31, 37 | 2 |
| L5 (41–50) | 41, 43, 47 | 3 |
| L6 (51–60) | 53, 59 | 2 |

### Por COLUNA (10 colunas — 4 ficam sem primos)
| Coluna | Primos | Qtd |
|---|---|---|
| C1 | 11, 31, 41 | 3 |
| C2 | 2 | 1 |
| C3 | 3, 13, 23, 43, 53 | 5 |
| C4 | — | 0 |
| C5 | 5 | 1 |
| C6 | — | 0 |
| C7 | 7, 17, 37, 47 | 4 |
| C8 | — | 0 |
| C9 | 19, 29, 59 | 3 |
| C10 | — | 0 |

> Colunas C4, C6, C8, C10 **não contêm primos** — serão omitidas do slide (igual ao tratamento que `aula02Helpers` faz com colunas ímpares).

### Por QUADRANTE (4 quadrantes)
| Quadrante | Primos | Qtd |
|---|---|---|
| Q1 (sup-esq) | 2, 3, 5, 11, 13, 23 | 6 |
| Q2 (sup-dir) | 7, 17, 19, 29 | 4 |
| Q3 (inf-esq) | 31, 41, 43, 53 | 4 |
| Q4 (inf-dir) | 37, 47, 59 | 3 |

> Q4 só tem 3 primos → o `topN` do slide de quadrantes precisa ser no máximo 3 (ou usar `min(topN, primosDoQuadrante.length)`).

### Por MINI-QUADRANTE (15 minis de 4 dezenas)
| Mini | Primos | Qtd |
|---|---|---|
| MQ1 [1,2,11,12] | 2, 11 | 2 |
| MQ2 [3,4,13,14] | 3, 13 | 2 |
| MQ3 [5,6,15,16] | 5 | 1 |
| MQ4 [7,8,17,18] | 7, 17 | 2 |
| MQ5 [9,10,19,20] | 19 | 1 |
| MQ6 [21,22,31,32] | 31 | 1 |
| MQ7 [23,24,33,34] | 23 | 1 |
| MQ8 [25,26,35,36] | — | 0 |
| MQ9 [27,28,37,38] | 37 | 1 |
| MQ10 [29,30,39,40] | 29 | 1 |
| MQ11 [41,42,51,52] | 41 | 1 |
| MQ12 [43,44,53,54] | 43, 53 | 2 |
| MQ13 [45,46,55,56] | — | 0 |
| MQ14 [47,48,57,58] | 47 | 1 |
| MQ15 [49,50,59,60] | 59 | 1 |

> MQ8 e MQ13 ficam sem primos — também serão omitidos.

### Top 15 PRIMOS
Só existem 17 primos no volante, então o ranking final por frequência histórica seleciona **15 dos 17** (deixando de fora os 2 primos menos sorteados na história).

## 2. Estrutura de arquivos a criar

Espelho exato da pasta `aula03/`:

```text
src/components/gravacao/mega30anos/aula04/
├── aula04Helpers.ts            (PRIMOS_LINHA, PRIMOS_COLUNA, PRIMOS_QUADRANTE, PRIMOS_MINI, TODOS_PRIMOS)
├── SlideTopPrimosPorLinhas.tsx
├── SlideTopPrimosPorColunas.tsx
├── SlideTopPrimosPorQuadrantes.tsx
├── SlideTopPrimosPorMinis.tsx
└── SlideTop15PrimosFinal.tsx
```

`aula04Helpers.ts` reaproveita as constantes da Aula 01 e filtra com `PRIMOS_MEGASENA` de `@/lib/megasena.ts`, exatamente como `aula02Helpers.ts`/`aula03Helpers.ts` fazem com par/ímpar.

## 3. Slides — adaptações em relação à Aula 03

- **Cor/tema**: manter a mesma identidade dourada/verde da Mega Especial 30 anos. Subtítulo: "Aula 04 · Top dezenas PRIMAS".
- **Linhas**: igual à Aula 03, top 4 (todas as linhas têm ≥2 primos).
- **Colunas**: filtrar apenas colunas com primos (renderiza 6 colunas em vez de 10). C3 mostra top 5; C7 top 4; C1/C9 top 3; C2/C5 mostram a única dezena.
- **Quadrantes**: top dinâmico = `min(8, qtdPrimos)`. Q1 mostra 6; Q2/Q3 mostram 4; Q4 mostra 3.
- **Mini-quadrantes**: paginação igual (pag 1 = MQ1–8, pag 2 = MQ9–15). MQ8 e MQ13 renderizam um placeholder discreto ("sem primos") ou são ocultados — recomendado **ocultar** para manter o visual limpo.
- **Top 15 final**: idêntico à Aula 03, só trocando `restringirA: TODOS_PRIMOS` e título: *"Top 15 dezenas PRIMAS para Mega Especial 30 anos / R$ 150 milhões"*.

## 4. Registro da aula

Em `src/pages/admin/gravacao/GravacaoMega30Anos.tsx`:
- Importar os 5 novos slides + `capa04` (assumindo `src/assets/gravacao/megasena-30anos/capas/capa-04.jpg`).
- Adicionar bloco `if (aulaId === "04") { ... }` no mesmo padrão dos blocos 02/03.
- Atualizar o guard `if (aulaId !== "01" && ... && aulaId !== "04")`.

> **Pendência:** preciso saber se já existe `capa-04.jpg` em `src/assets/gravacao/megasena-30anos/capas/`. Se não existir, posso (a) reutilizar uma capa provisória ou (b) gerar uma nova capa dourada — me diga qual prefere.

## 5. Catálogo de estudos (`src/lib/mega30/estudosCatalog.ts`)
Adicionar entrada para `aulaId: "04"` com título *"Top dezenas primas nos 30 anos"* (verificar se já existe; se sim, só confirmar).

## 6. Pontos a confirmar antes de implementar

1. Lista oficial de primos: usar **`PRIMOS_MEGASENA`** já existente (inclui o **1**? Não — começa em 2, padrão matemático correto). ✅
2. Capa 04 já existe ou preciso gerar/usar provisória?
3. Ok ocultar colunas/minis sem primos (em vez de mostrar vazio)?

Confirmando esses 3 pontos, implemento a aula completa em uma rodada.
