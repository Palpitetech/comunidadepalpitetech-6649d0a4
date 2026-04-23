

## Padronizar a definição de "Quente" e "Fria" (todas as loterias)

### Texto fixo aprovado pelo usuário

> **Dezenas Quentes** são as dezenas com **maior presença** nos últimos sorteios — saíram mais e tendem a continuar aparecendo com frequência.
>
> **Dezenas Frias** são as que estão **saindo pouco** nos últimos sorteios — têm presença abaixo do esperado na janela atual.

Esse bloco passa a ser o glossário oficial em todos os posts e engines, tanto Lotofácil quanto Mega-Sena (e qualquer loteria futura herda automaticamente).

### Onde aplicar

Hoje a explicação aparece dentro do post **`analise_como_calculamos`** de cada engine, com textos diferentes:

| Loteria | Onde está | Texto atual |
|---|---|---|
| Lotofácil | `lotofacil/engine.ts` linhas 2218-2219 | `QUENTE: top 5 mais frequentes... / FRIA: bottom 5 menos frequentes...` (técnico) |
| Mega-Sena | `megasena/engine.ts` linhas 334-335 | `Acima de 10% é quente; abaixo é fria.` (técnico) |

Solução: **centralizar a definição em um único helper compartilhado** e referenciar nos dois engines (e futuros).

### Mudanças técnicas (3 arquivos)

**1. Novo arquivo: `supabase/functions/_shared/guide-post/glossario.ts`**

```ts
// Glossário oficial — definições padronizadas em TODAS as loterias.
// Editar aqui propaga para Lotofácil, Mega-Sena e novas loterias.
export const DEFINICAO_QUENTE_FRIA =
  `🎯 O que é "Quente" e "Fria"\n` +
  `🔥 **Dezenas Quentes** são as dezenas com **maior presença** nos últimos sorteios — ` +
  `saíram mais e tendem a continuar aparecendo com frequência.\n` +
  `❄️ **Dezenas Frias** são as que estão **saindo pouco** nos últimos sorteios — ` +
  `têm presença abaixo do esperado na janela atual.\n` +
  `⚠️ Lembre: matematicamente cada dezena tem a mesma chance a cada sorteio. ` +
  `Use Quentes/Frias como filtro de tendência, não como certeza.`;
```

**2. `supabase/functions/_shared/guide-post/lotofacil/engine.ts`**

- Importar `DEFINICAO_QUENTE_FRIA` no topo.
- Em `analise_como_calculamos` (linhas 2215-2221): remover o bloco `🔍 Definições oficiais` antigo e injetar `DEFINICAO_QUENTE_FRIA` no lugar; manter as outras definições técnicas (FIÉL, VOLÁTIL, ACELERANDO, DESACELERANDO) como bloco separado abaixo.
- Em `analise_movimentacao` (linha 1907, `blocoPanorama`): inserir `DEFINICAO_QUENTE_FRIA` logo após o painel de panorama, antes dos blocos Quentes/Frias — dá contexto pro leitor toda vez que abre um post de Quentes e Frias, não só no "Como Calculamos".

**3. `supabase/functions/_shared/guide-post/megasena/engine.ts`**

- Importar `DEFINICAO_QUENTE_FRIA` no topo.
- Em `montarFatosComoCalculamos` (linhas 334-335): substituir o trecho `🎯 O que é "quente" e "fria" na Mega...` por `DEFINICAO_QUENTE_FRIA`.
- Em `montarFatosMovimentacao` (linha 86, `resumo`): inserir `DEFINICAO_QUENTE_FRIA` entre o painel de panorama e o bloco "🔥 Dezenas QUENTES".

### Por que injetar em `analise_movimentacao` também

Os posts de "Quentes e Frias" são os mais lidos no feed Estudos. Hoje o leitor vê só a lista de dezenas, sem a definição. Quem nunca leu o "Como Calculamos" não entende. Adicionar a definição direto no post elimina a dúvida do usuário (que motivou esta tarefa) e padroniza a leitura em qualquer loteria.

### O que NÃO muda

- Frontend (`Comunidade.tsx`, `PostagemDetalhe`, cards) — zero alteração; o texto novo já vem renderizado no `conteudo` do post.
- Lógica de cálculo de quente/fria (top 5 / acima da média) — segue idêntica.
- Whitelist anti-alucinação, fallback determinístico, dedup — intactos.
- Posts já gerados — continuam visíveis com o texto antigo. Para reescrever os de hoje, basta deletar e regerar manualmente (ver verificação).
- Outros tipos de post (moldura, repetidas, linhas, etc.) — não recebem o glossário; mantém foco temático.

### Verificação

1. **Deploy** das edge functions afetadas.
2. **Lotofácil:** `curl_edge_functions` → `generate-guide-post` com `{ tipo_post: "analise_movimentacao", loteria: "lotofacil", force: true }` → verificar que o post novo contém o bloco "O que é Quente e Fria" antes da lista de quentes.
3. **Mega-Sena:** mesma chamada com `loteria: "megasena"` → verificar bloco presente.
4. **Como Calculamos:** gerar `analise_como_calculamos` em ambas → verificar que o texto novo aparece no lugar do antigo.
5. **Feed Estudos:** abrir `/comunidade`, alternar filtro Lotofácil ↔ Mega-Sena → posts novos exibem a definição padronizada.
6. **Dezenas inventadas:** validar que a whitelist segue ativa (texto novo não cita números fora da faixa).

### Riscos

| Risco | Mitigação |
|---|---|
| Posts antigos ficam com texto velho | Aceito — só novos posts pegam a redação nova. Se quiser regerar os de hoje, deleto manualmente e disparo `force: true`. |
| Limite de caracteres do post estourar | O glossário tem ~340 chars; limite atual é 1500-2200. Folga ampla. |
| Quina/Dupla Sena no futuro | Quando criarmos esses engines, basta importar `DEFINICAO_QUENTE_FRIA` — herdam automaticamente. |

