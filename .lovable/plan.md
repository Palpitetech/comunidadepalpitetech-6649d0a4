# Aula 07 — Dezenas de Início (Top Inicial, Pares e Ímpares)

Estudo das **dezenas iniciais** (menor dezena de cada concurso) ao longo dos 3.007 concursos da Mega-Sena.

## 1. Conceito

Para cada concurso, considera-se apenas a **menor dezena sorteada** (posição 01 quando ordenado crescente). Sobre esse universo de 3.007 dezenas iniciais, geramos três rankings independentes:

- **Top 10 Inicial Geral** — as 10 dezenas que mais vezes apareceram como inicial.
- **Top 10 Inicial Pares** — filtrando apenas dezenas pares dentre as iniciais.
- **Top 10 Inicial Ímpares** — filtrando apenas dezenas ímpares dentre as iniciais.

Cada item exibe **dezena, frequência absoluta e % sobre o total de concursos** (3.007).

### Observação estatística (importante para o vídeo)
A "dezena inicial" é fortemente enviesada para números baixos (probabilidade matemática). A maioria dos iniciais tende a estar entre 01 e ~15. Isso será respeitado no roteiro — não é viés do estudo, é matemática do `min` sobre 6 dezenas em [01..60]. O slide-síntese vai destacar isso.

## 2. Helpers

Arquivo: `src/components/gravacao/mega30anos/aula07/aula07Helpers.ts`

```ts
export type DezenaInicialFreq = {
  dezena: number;       // 01..60
  freq: number;         // ocorrências como inicial
  pct: number;          // freq / totalConcursos * 100
};

dezenaInicialDe(c): número  // min das 6 dezenas
freqInicialPorDezena(concursos): Map<dezena, freq>  // base bruta
topInicialGeral(concursos, n=10): DezenaInicialFreq[]
topInicialPares(concursos, n=10): DezenaInicialFreq[]
topInicialImpares(concursos, n=10): DezenaInicialFreq[]
```

`pct` sempre calculado sobre `concursos.length` (total de concursos, não sobre o subconjunto par/ímpar) — assim os 3 slides são comparáveis na mesma régua.

## 3. Componente compartilhado

`src/components/gravacao/mega30anos/aula07/RankingDezenaInicial.tsx`

Lista vertical (10 itens) — mesmo DNA visual das aulas anteriores (dourado/verde-escuro):

```
[#1] [bola 03]  ████████████████████  248x   8,25%
[#2] [bola 05]  ██████████████████    231x   7,68%
...
```

- Bola pintada com a cor par/ímpar conforme o slide (verde-claro p/ pares, dourado p/ ímpares, neutro p/ geral)
- Barra horizontal proporcional ao maior valor da lista
- Top 1 com glow

## 4. Estrutura dos 5 slides

Pasta: `src/components/gravacao/mega30anos/aula07/`

| # | Componente | Conteúdo |
|---|---|---|
| 1 | `Mega30CapaProvisoria` | Capa provisória "Aula 07 · Dezenas de Início" até o usuário enviar `capa-07.jpg` |
| 2 | `SlideTopInicialGeral` | Top 10 dezenas iniciais (qualquer paridade) — ranking + freq + % |
| 3 | `SlideTopInicialPares` | Top 10 dezenas iniciais **pares** |
| 4 | `SlideTopInicialImpares` | Top 10 dezenas iniciais **ímpares** |
| 5 | `SlideSinteseInicial` | Síntese: 1 jogo-exemplo de 6 dezenas começando pela top inicial geral + comentário sobre o viés matemático e como usar (ex: "fixar 03 ou 05 como menor dezena do volante") |

## 5. Registro

- `src/pages/admin/gravacao/GravacaoMega30Anos.tsx`: importar slides, adicionar `"07"` ao guard, bloco `if (aulaId === "07") {...}`.
- `src/config/adminNavConfig.ts`: adicionar `"Aula 07 — Dezenas de início"` → `/admin/gravacao/mega-especial/07`.
- `src/components/admin/AdminCommandPalette.tsx`: entrada Aula 07.
- `src/lib/mega30/estudosCatalog.ts`: registrar `aulaId: "07"` com título "Dezenas de Início — Top Geral, Pares e Ímpares".

## 6. Pendências

- **Capa**: enviar `capa-07.jpg` quando pronta. Até lá, `Mega30CapaProvisoria`.
- Confirmar subtítulo: sugiro **"Aula 07 · Dezenas de Início — Top Geral, Pares e Ímpares"**.

## 7. Fora de escopo

- Sem backend, migrations ou hub público.
- Sem slide de descrição do YouTube (mesmo padrão das aulas 02–06).
- Usa `useMegaEspecialBase` (mesma base dos 3.006/3.007 concursos já carregados).
