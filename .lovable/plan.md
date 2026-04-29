# Sincronizar slides com o estudo real "Posições Finais"

Hoje os slides de gravação calculam frequências por conta própria (`useDezenasporPosicaoMegaSena`) e não correspondem ao estudo que será publicado na comunidade. Vamos invertir: o **estudo é a fonte da verdade** — exatamente como acontece no "Gerador a partir de Estudo".

## Fonte de dados

A tabela `postagens` já guarda tudo no `fatos_snapshot` (jsonb) das postagens com `tema_estudo = 'analise_posicoes_finais'`:

```text
fatos_snapshot:
  proximo_concurso: 3001
  ultimo_concurso: 3000
  recomendacao_direta: "Use o trio final 31, 36, 58..."
  base_geracao:
    fixar:  [31, 36, 58]   <- TRIO recomendado
    apoio:  [32, 40, 60]
  resumo:  markdown com "P4 — top frequentes\n**31** (3×), **32** (3×)..."
```

## Mudanças

### 1. Novo hook `useEstudoPosicoesFinais(postagemId?)`
- Busca uma postagem específica (por id) ou a mais recente de `tema_estudo='analise_posicoes_finais'` (status publicado OU rascunho).
- Faz parse do `resumo` via regex para extrair P4/P5/P6 com top frequentes (`**31** (3×)`).
- Lê `base_geracao.fixar` para o trio, `apoio` para alternativas.
- Busca `proximos_concursos` para data + prêmio estimado do `proximo_concurso`.
- Retorna objeto tipado: `{ id, titulo, status, proximo_concurso, ultimo_concurso, janela, trio, apoio, posicoes[], recomendacao, proximo_data_label, premio_estimado }`.
- Hook auxiliar `useEstudosPosicoesFinaisLista()` lista os últimos 30 estudos para o seletor.

### 2. Página `PosicoesFinaisMegaSena.tsx` reescrita
- Aceita `?postagem=<id>` na URL (em vez de `?concurso=`).
- Se ausente, abre o estudo mais recente (rascunho ou publicado).
- Loading e empty-state quando não houver estudo.
- Repassa os dados do estudo para os slides — sem mais cálculo on-the-fly.

### 3. Seletor `SeletorEstudo.tsx` (substitui `SeletorConcurso`)
- Floating dropdown listando estudos: "Concurso 3001 · publicado · 28/04" / "rascunho".
- Badge visual diferenciando rascunho × publicado.
- Ao selecionar, atualiza `?postagem=<id>`.

### 4. Slides ajustados
- **Slide1Intro**: usa `concurso` (proximo) + `data` do estudo + badge de status (rascunho/publicado).
- **Slide2Explicacao**: subtitulo passa a usar a `janela` real do estudo (ex: 20 sorteios) em vez do hardcoded "100 sorteios".
- **SlidePosicao** (P4/P5/P6): consome `posicoes[]` do estudo. Se a posição tem só 4 itens, renderiza 4. Se vazia, mostra placeholder.
- **Slide6Conclusao**: trio = `base_geracao.fixar`. Adiciona `apoio` como alternativas. `recomendacao_direta` aparece em destaque. Prêmio + próximo concurso vêm do estudo.

### 5. Listagem em `/admin/gravacao/estudos/megasena`
- A seção "Apresentações para gravação" passa a listar UM card por estudo recente de "Posições Finais" (rascunho + publicado), cada um abrindo o slideshow com `?postagem=<id>`.
- Mantém o card genérico "abrir o mais recente" sem parâmetro.
- Badge de status do estudo (publicado/rascunho) e número do concurso visíveis.

## Arquivos

**Criar**
- `src/hooks/useEstudoPosicoesFinais.ts`
- `src/components/gravacao/estudos/SeletorEstudo.tsx`

**Editar**
- `src/pages/admin/gravacao/estudos/PosicoesFinaisMegaSena.tsx` — usa novo hook, parâmetro `postagem`.
- `src/components/gravacao/estudos/posicoes-finais/Slide1Intro.tsx` — badge status + `janela`.
- `src/components/gravacao/estudos/posicoes-finais/Slide2Explicacao.tsx` — `janela` dinâmica.
- `src/components/gravacao/estudos/posicoes-finais/SlidePosicao.tsx` — consome top do estudo.
- `src/components/gravacao/estudos/posicoes-finais/Slide6Conclusao.tsx` — trio + apoio + recomendação.
- `src/pages/admin/gravacao/GravacaoEstudos.tsx` — listagem dinâmica de estudos.

**Remover** (deprecated)
- `src/components/gravacao/estudos/SeletorConcurso.tsx` (substituído por `SeletorEstudo`).
- Uso de `useDezenasporPosicaoMegaSena` no slide (hook permanece para outras telas).

## Resultado

Cada postagem de "Posições Finais" da Mega — rascunho ou publicada — vira um slide pronto pra gravar, com os mesmos números, mesmo trio, mesma janela, mesmo prêmio que o usuário verá na comunidade. Igualzinho ao gerador-a-partir-de-estudo.