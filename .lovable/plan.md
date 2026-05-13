# Aula 06 — Colunas Quentes: Início, Fim e Geral

Mesma proposta da Aula 05, porém aplicada às **10 colunas** do volante (C1=01,11,21,31,41,51 … C10=10,20,30,40,50,60), usando todos os 3.006 concursos da Mega-Sena.

## 1. Conceito (idêntico à Aula 05, adaptado p/ colunas)

Para cada concurso de 6 dezenas:
- **Inicial** = menor dezena → mapeada para sua coluna via `((d-1) % 10) + 1`
- **Final** = maior dezena → mapeada para sua coluna
- **Geral** = todas as 6 dezenas → coluna de cada uma (com repetição quando 2+ caem na mesma coluna)

Base: `useMegaEspecialBase` (mesmo hook da Aula 05).

## 2. Helpers

Arquivo: `src/components/gravacao/mega30anos/aula06/aula06Helpers.ts`

```ts
COLUNAS = [1..10]
colunaDe(d) = ((d - 1) % 10) + 1
freqInicioPorColuna(concursos): FreqColuna[]    // soma = 3006
freqFimPorColuna(concursos):    FreqColuna[]    // soma = 3006
freqGeralPorColuna(concursos):  FreqColuna[]    // soma = 3006*6
topDezenaInicialPorColuna(concursos): TopDezenaColuna[]  // dezena mais frequente como inicial em cada coluna
topDezenaFinalPorColuna(concursos):   TopDezenaColuna[]
```

Tipos análogos a `FreqLinha` / `TopDezenaLinha` da Aula 05.

## 3. Componente compartilhado

`src/components/gravacao/mega30anos/aula06/BarraColunaHorizontal.tsx`

Mesmo padrão visual do `BarraLinhaHorizontal` (dourado/verde, glow no top 1, valor + %), apenas trocando label "L" por "C" e suportando 10 itens (barras um pouco mais finas para caber 10 linhas no slide).

## 4. Estrutura dos 7 slides

Pasta: `src/components/gravacao/mega30anos/aula06/`

| # | Componente | Conteúdo |
|---|---|---|
| 1 | `Mega30CapaProvisoria` | Capa provisória (aula 6) até o usuário enviar `capa-06.jpg` |
| 2 | `SlideFreqInicioPorColuna` | Barras horizontais das 10 colunas — quantas vezes cada coluna teve a dezena **inicial**. Top 1 destacado. |
| 3 | `SlideTopInicialPorColuna` | Volante 6×10 marcando 1 bola por coluna (a dezena que mais foi inicial naquela coluna) com contador. Colunas sem ocorrência apagadas. |
| 4 | `SlideFreqFimPorColuna` | Espelho do slide 2 para **final**. |
| 5 | `SlideTopFinalPorColuna` | Espelho do slide 3 para **final**. |
| 6 | `SlideFreqGeralPorColuna` | Barras horizontais da frequência **geral** por coluna (~10% esperado por coluna), destacando coluna mais quente. |
| 7 | `SlideSinteseColunas` | Síntese-estratégia: "Comece em C_, termine em C_, reforce C_" + 1 jogo-exemplo de 6 dezenas montado a partir das top dezenas das colunas mais quentes. |

## 5. Registro

`src/pages/admin/gravacao/GravacaoMega30Anos.tsx`:
- Importar 6 slides da Aula 06
- Adicionar `"06"` no guard de aulas válidas
- Adicionar bloco `if (aulaId === "06") { ... }` com `Mega30CapaProvisoria` + 6 slides

`src/config/adminNavConfig.ts`:
- Adicionar item `"Aula 06 — Colunas quentes"` → `/admin/gravacao/mega-especial/06`

`src/components/admin/AdminCommandPalette.tsx`:
- Adicionar entrada Aula 06 na categoria "Gravação".

`src/lib/mega30/estudosCatalog.ts`:
- Verificar/adicionar `aulaId: "06"` com título "Colunas Quentes — Início, Fim e Geral".

## 6. Pendências do usuário

1. **Capa**: enviar `capa-06.jpg` quando estiver pronta. Até lá uso `Mega30CapaProvisoria` (mesmo padrão da Aula 05).
2. Confirmar subtítulo da capa: sugiro **"Aula 06 · Colunas Quentes — Início, Fim e Geral"**.

## 7. Fora de escopo

- Não toca em backend, migrations, nem hub público.
- Sem slide de descrição do YouTube (mesmo padrão das aulas 02–05).
- Mesma decisão Opção A (interpretação matemática min/max) — sem ordem real de bolas.
