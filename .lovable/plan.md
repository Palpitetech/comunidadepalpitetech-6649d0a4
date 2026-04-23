

## Como funciona o "motor" dos posts hoje

Cada tipo de post tem **3 camadas**:

1. **Motor de fatos (TypeScript puro)** — calcula números reais (frequências, médias, distribuições). Nunca alucina.
2. **Prompt da IA** — recebe os fatos prontos e escreve o texto humanizado em volta deles.
3. **Validador + fallback** — se a IA inventar número, descarta e usa template fixo.

Os 6 tipos de post diários estão em `supabase/functions/generate-guide-post/index.ts`, cada um numa função `montarFatos()` (case `analise_linhas`, `analise_colunas`, `analise_ciclo`, etc.).

## Como você dá ordens para melhorar cada post

Você me dá a ordem em **linguagem natural**, dizendo:
- **Qual tipo de post** quer mexer (ex: "análise por linhas", "quentes e frias", "ciclo")
- **O que quer adicionar/mudar no conteúdo** (ex: "quero que mostre X antes de Y")
- **Se é texto novo ou substituir** algo existente

Eu traduzo isso em ajustes nos 2 lugares certos:
- **`montarFatos()`** — adiciona o cálculo novo (números reais).
- **`montarPrompt()`** — instrui a IA a usar esses números no texto.
- **Validador** — libera os novos números na whitelist.
- **Fallback** — atualiza o template fixo para também incluir o novo bloco.

## Sua ordem para Linhas e Colunas

Você pediu detalhamento por linha/coluna no formato:

```text
Linha 1: tivemos 32 ocorrências, com mais frequência de 3 dezenas (12x) e 4 dezenas (10x)
Linha 2: ...
```

Vou implementar exatamente isso, calculando para cada uma das 5 linhas (e 5 colunas) nos últimos 10 sorteios:
- **Total de ocorrências** (soma de quantas dezenas daquela linha caíram nos 10 sorteios)
- **Distribuição** (quantas vezes caíram 2, 3, 4, 5 dezenas daquela linha — destacando as 2 quantidades mais frequentes)

## O que vai ser alterado

**Arquivo único:** `supabase/functions/generate-guide-post/index.ts`

### 1. Novo cálculo determinístico (motor)
Adicionar função `detalharLinhasColunas(concursos, eixo: 'linha' | 'coluna')` que retorna, para cada índice 1–5:
- total de ocorrências nos 10 sorteios
- distribuição por quantidade de dezenas (2, 3, 4, 5) com as 2 mais frequentes

### 2. Atualizar `montarFatos()` para `analise_linhas` e `analise_colunas`
O `resumo` passa a incluir o detalhamento linha por linha (ou coluna por coluna), exemplo:

```text
📐 Análise por Linhas (últimos 10 sorteios)

Linha 1 (01-05): 28 ocorrências
  → mais comum: 3 dezenas (5x) e 2 dezenas (3x)
Linha 2 (06-10): 31 ocorrências
  → mais comum: 3 dezenas (6x) e 4 dezenas (2x)
...
```

### 3. Atualizar `montarPrompt()`
Instruir a IA a manter o bloco linha-por-linha **literal** no texto e só humanizar a abertura/fechamento.

### 4. Atualizar validador e fallback
- Whitelist permite os novos números (ocorrências de 0–60, quantidades 0–5).
- Fallback determinístico passa a renderizar o bloco detalhado direto, sem IA, caso ela falhe.

## Garantias

- Números 100% reais (vêm do motor TypeScript).
- IA só humaniza a abertura e o fechamento.
- Se a IA tentar inventar — fallback publica o detalhamento exato.
- Aplicado tanto em **Análise por Linhas** quanto em **Análise por Colunas**.

## Próximas ordens (formato sugerido)

Para qualquer outro post, basta você dizer algo como:
- "No post de **quentes e frias**, quero que mostre também **há quantos sorteios cada fria não sai**."
- "No post de **ciclo**, quero que liste as dezenas faltantes **em ordem de atraso**, não numérica."
- "No post de **moldura**, quero comparar a média de moldura dos últimos 10 com a média histórica."

Eu transformo cada pedido numa alteração no motor + prompt + validador + fallback.

