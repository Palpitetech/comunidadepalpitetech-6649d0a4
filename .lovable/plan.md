# Aula 08 — Dezenas Finais (6ª bola)

Reescrever a Aula 08 para espelhar **exatamente** a Aula 07, trocando o universo: em vez da MENOR dezena de cada concurso (1ª bola), usar a MAIOR dezena de cada concurso (6ª bola).

## O que muda

A versão atual analisa "dezenas pares" (Inicial Par / Final Par / Par Geral). Vamos descartar essa abordagem e adotar o mesmo formato da Aula 07.

## Estrutura final (4 slides + capa)

| # | Slide | Conteúdo |
|---|---|---|
| 1 | Capa (`capa-08.jpg`) | Já existe |
| 2 | `SlideTopFinalGeral` | Top 10 dezenas que mais saíram como 6ª bola (geral) |
| 3 | `SlideTopFinalPares` | Top 10 finais **pares** |
| 4 | `SlideTopFinalImpares` | Top 10 finais **ímpares** |
| 5 | `SlideSinteseFinal` | Top 3 de cada categoria + jogo-exemplo |

## Implementação técnica

### Helpers — `src/components/gravacao/mega30anos/aula08/aula08Helpers.ts` (reescrever)
- `dezenaFinalDe(c) = Math.max(...c.dezenas)`
- `freqFinalPorDezena(concursos)` → Map dezena → ocorrências
- `topFinalGeral`, `topFinalPares`, `topFinalImpares` (mesma assinatura/`rankFromMap` da Aula 07)

### Componentes (espelhar Aula 07)
- `RankingDezenaFinal.tsx` — clone de `RankingDezenaInicial` (mesma identidade visual, cor pode permanecer verde Mega)
- `SlideTopFinalGeral.tsx`
- `SlideTopFinalPares.tsx`
- `SlideTopFinalImpares.tsx`
- `SlideSinteseFinal.tsx` — Top 3 geral / pares / ímpares; jogo-exemplo terminando na top final geral

Cabeçalho (`Mega30Header`): `aula={8}`, `estudoNome="Top 10 dezenas finais (6ª bola)"`, `tipoAnalise` indicando "Maior dezena de cada concurso · N concursos".

### Limpar arquivos antigos
Remover (não usados após a troca):
- `SlideTopInicialPar.tsx`
- `SlideTopFinalPar.tsx`
- `SlideTopParGeral.tsx`
- `SlideSintesePares.tsx`
- `RankingDezenaPar.tsx`

### Registro
- `GravacaoMega30Anos.tsx`: trocar imports/JSX do bloco `aulaId === "08"` para os 4 novos slides.
- Sem mudanças em `adminNavConfig.ts`/`AdminCommandPalette.tsx` (Aula 08 já registrada).

## Fora de escopo
- Sem backend, sem alterar capa, sem hub público, sem slide YouTube.
