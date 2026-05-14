# Aula 08 — Dezenas Pares (Top Inicial Par, Final Par e Geral)

Estudo das **dezenas pares** ao longo dos 3.007 concursos da Mega-Sena, no mesmo padrão da Aula 07 (rankings vertical com barra horizontal, frequencia absoluta e percentual).

## 1. Conceito

Para cada concurso, das 6 dezenas sorteadas extraimos as **pares**. Sobre esse universo geramos tres rankings:

- **Top 10 Inicial Par** — a menor dezena par de cada concurso (quando o concurso tem ao menos 1 par).
- **Top 10 Final Par** — a maior dezena par de cada concurso (quando o concurso tem ao menos 1 par).
- **Top 10 Par Geral** — todas as ocorrencias de pares em qualquer posicao do concurso (ranking bruto de frequencia, como o Top 15 da Aula 01, mas filtrando so pares).

Cada item exibe **dezena, frequencia absoluta e % sobre o total de concursos** (3.007).

## 2. Helpers

Arquivo: `src/components/gravacao/mega30anos/aula08/aula08Helpers.ts`

```ts
export type DezenaParFreq = {
  dezena: number;   // 02, 04, 06... 60 (so pares)
  freq: number;     // ocorrencias
  pct: number;      // freq / totalConcursos * 100
};

// Para cada concurso, retorna as dezenas pares ordenadas
paresDoConcurso(c): number[]

// Menor par do concurso (ou null se nao houver par)
inicialParDe(c): number | null

// Maior par do concurso (ou null se nao houver par)
finalParDe(c): number | null

// Mapa dezena -> ocorrencias como inicial par
freqInicialParPorDezena(concursos): Map<number, number>

// Mapa dezena -> ocorrencias como final par
freqFinalParPorDezena(concursos): Map<number, number>

// Mapa dezena -> ocorrencias em qualquer posicao (so pares)
freqParGeralPorDezena(concursos): Map<number, number>

// Rankings
function rankFromMap(m, total, topN): DezenaParFreq[]
topInicialPar(concursos, topN=10): DezenaParFreq[]
topFinalPar(concursos, topN=10): DezenaParFreq[]
topParGeral(concursos, topN=10): DezenaParFreq[]
```

## 3. Componente compartilhado

`src/components/gravacao/mega30anos/aula08/RankingDezenaPar.tsx`

Reutiliza o mesmo DNA visual da Aula 07 (`RankingDezenaInicial`), adaptando para dezenas pares:
- Cor verde (#43A047) como padrao para todos os slides (afinal e tudo par)
- Bola `DezenaBolaMega` com as dezenas pares
- Barra horizontal proporcional ao maior valor
- Top 1 com glow verde

## 4. Estrutura dos 5 slides

Pasta: `src/components/gravacao/mega30anos/aula08/`

| # | Componente | Conteudo |
|---|---|---|
| 1 | `Mega30CapaProvisoria` | Capa provisoria "Aula 08 · Dezenas Pares" ate enviar `capa-08.jpg` |
| 2 | `SlideTopInicialPar` | Top 10 menores pares por concurso — ranking + freq + % |
| 3 | `SlideTopFinalPar` | Top 10 maiores pares por concurso — ranking + freq + % |
| 4 | `SlideTopParGeral` | Top 10 pares mais frequentes em qualquer posicao — ranking + freq + % |
| 5 | `SlideSintesePares` | Top 3 de cada categoria + jogo-exemplo começando com a top inicial par e fechando com a top final par |

## 5. Registro

- `src/pages/admin/gravacao/GravacaoMega30Anos.tsx`: importar slides, adicionar `"08"` ao guard, bloco `if (aulaId === "08") {...}`.
- `src/config/adminNavConfig.ts`: adicionar entrada Aula 08.
- `src/components/admin/AdminCommandPalette.tsx`: entrada Aula 08.

## 6. Pendencias

- **Capa**: enviar `capa-08.jpg` quando pronta. Ate la, `Mega30CapaProvisoria`.
- Confirmar subtitulo: sugiro **"Aula 08 · Dezenas Pares — Top Inicial, Final e Geral"**.

## 7. Fora de escopo

- Sem backend, migrations ou hub publico.
- Sem slide de descricao do YouTube.
- Usa `useMegaEspecialBase`.
