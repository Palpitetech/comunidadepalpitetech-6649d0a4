# Aula 05 — Linhas Quentes: Início, Fim e Geral

Análise por linha do volante (L1=01–10 … L6=51–60) considerando 3 papéis que cada linha pode ter em um sorteio de 6 dezenas:

- **Inicial** = a **menor** dezena do concurso (interpretação matemática, já que a base não armazena ordem real de bolas)
- **Final** = a **maior** dezena do concurso
- **Geral** = todas as 6 dezenas do concurso (com repetição quando 2+ caem na mesma linha)

Base: 3.006 concursos da `resultados_loterias` (loteria=megasena), via `useMegaEspecialBase`.

## 1. Dados a calcular (helpers da aula)

Arquivo: `src/components/gravacao/mega30anos/aula05/aula05Helpers.ts`

Funções puras que recebem `ConcursoMega[]` e devolvem:

```ts
freqInicioPorLinha(concursos): Record<1..6, number>     // soma = 3006
freqFimPorLinha(concursos):    Record<1..6, number>     // soma = 3006
freqGeralPorLinha(concursos):  Record<1..6, number>     // soma = 3006*6
topDezenaInicialPorLinha(concursos): Record<1..6, {dezena, freq} | null>
topDezenaFinalPorLinha(concursos):   Record<1..6, {dezena, freq} | null>
```

Lógica: para cada concurso ordenar `dezenas` crescente, pegar `min` (inicial) e `max` (final), mapear para a linha via `Math.ceil(d/10)`.

## 2. Estrutura dos 7 slides

Pasta: `src/components/gravacao/mega30anos/aula05/`

| # | Componente | Conteúdo |
|---|---|---|
| 1 | `Mega30Capa` | Capa enviada pelo usuário → `capa-05.jpg` |
| 2 | `SlideFreqInicioPorLinha.tsx` | **Barras horizontais** das 6 linhas com nº de vezes que cada linha foi a "inicial". Destaque para top 1. |
| 3 | `SlideTopInicialPorLinha.tsx` | Volante 6×10 marcando 1 bola por linha (a dezena que mais foi inicial dentro daquela linha) com contador. Linhas sem ocorrência ficam apagadas. |
| 4 | `SlideFreqFimPorLinha.tsx` | Espelho do slide 2 para "final". |
| 5 | `SlideTopFinalPorLinha.tsx` | Espelho do slide 3 para "final". |
| 6 | `SlideFreqGeralPorLinha.tsx` | Barras horizontais da frequência geral por linha (~16,6% cada esperado), destacando linha mais quente. |
| 7 | `SlideSinteseLinhas.tsx` | Síntese-estratégia: "Comece em L_, termine em L_, reforce L_" + 1 jogo-exemplo de 6 dezenas montado a partir das top dezenas das linhas mais quentes em cada papel. |

## 3. Componente compartilhado

`src/components/gravacao/mega30anos/aula05/BarraLinhaHorizontal.tsx`

Barra horizontal estilizada no padrão dourado/verde Mega Especial, com:
- Label "L1" (01–10) à esquerda
- Barra preenchida proporcional ao máximo da série
- Valor absoluto + % à direita
- `topRank === 1` ganha glow dourado e borda mais forte

Reutilizado pelos slides 2, 4 e 6.

## 4. Registro da aula

Em `src/pages/admin/gravacao/GravacaoMega30Anos.tsx`:
- Importar 5 slides + `capa-05.jpg`
- Adicionar bloco `if (aulaId === "05") { ... }` no padrão dos blocos 02/03/04
- Atualizar guard para incluir `"05"`

Em `src/lib/mega30/estudosCatalog.ts`:
- Verificar/adicionar entrada `aulaId: "05"` com título "Linhas Quentes — Início, Fim e Geral"

## 5. Pendências do usuário antes de codar

1. **Enviar `capa-05.jpg`** (usuário disse que vai enviar). Sem ela uso placeholder dourado provisório.
2. Confirmar se mantém o subtítulo "Aula 05 · Linhas Quentes" ou prefere outro texto.

## 6. O que NÃO está no escopo

- Não toca em backend / migrations (decisão Opção A: usar interpretação matemática min/max).
- Não cria página pública no hub Mega 30 (segue padrão das outras aulas — só admin de gravação).
- Não adiciona slide de descrição YouTube (aulas 02–04 também não têm).
