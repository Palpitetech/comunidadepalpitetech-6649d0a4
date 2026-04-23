

## Gerador de Estudo (`/lotofacil/gerador-estudo`)

### Resposta direta

- **Pré-geração de posts, campos novos em `postagens` e submenu Gravação Estudos:** já existem em produção (verificado nas rodadas anteriores). Esta rodada **não os recria**.
- **Gerador de Estudo:** novo. É o foco real desta entrega.

### Arquitetura

```text
┌────────────────────────────────────────────────────────────┐
│  PostDetalhes  ──[Gerar palpites com esse estudo]──┐       │
│                                                    ▼       │
│  HubLotofácil ──[Card "Gerador de Estudo"]──► /lotofacil/  │
│                                                gerador-    │
│                                                estudo      │
│                                                ?postId=…   │
│                                                            │
│  GeradorEstudo (página)                                    │
│   ├─ EstudoSelector (dropdown com último ▲ ✅)             │
│   ├─ QuantidadeSelector + DezenasSelector (reuso)          │
│   ├─ Card "Estratégia deste estudo" (preview)              │
│   ├─ Botão Gerar                                           │
│   └─ ResultadosSheet (reuso do gerador clássico)           │
│        └─ EstrategiaCard (reuso) com texto humanizado IA   │
└────────────────────────────────────────────────────────────┘
```

### Backend

**Refatorar `generate-palpites-from-estudo`** (já existe, vira o motor único):
- Aceitar `quantidade` (1-12) **e novo `qtd_dezenas`** (15-20 Lotofácil; 6-10 Mega).
- Trocar gating premium para **nova quota separada**: tabela `gerador_estudo_daily_usage` (espelho de `gerador_daily_usage`) + função `incrementar_uso_gerador_estudo`. Limite: free 0 (premium-only), premium 30/dia, admin ∞.
- Após gerar jogos determinísticos, montar `EstrategiaData` estruturado por tema (ferramentas, dezenas-chave, filtros) e chamar **Lovable AI Gemini Flash** apenas para reescrever `conclusao` em 2-3 frases persuasivas. Se IA falhar/timeout 4s, usa `conclusao` template determinística. Nunca atrasa a geração dos números.
- Retornar payload no **mesmo shape** do `/generate-palpites` clássico para `ResultadosSheet` funcionar sem branch (`{ jogos: [{dezenas:[]}], estrategia: EstrategiaData, baseado_em: {...}, remaining_today, max_per_day }`).

**Nova edge function `list-estudos-disponiveis`** (GET):
- Query: `loteria=lotofacil`, `limit=10`.
- Retorna estudos do banco (status `publicado` OR `rascunho` para admin) com `fatos_snapshot` não-nulo, ordenados por `publicar_em DESC`. Cada item: `{id, titulo, tema_estudo, proximo_concurso, ultimo_concurso, publicar_em, status, eh_futuro}`.
- Usado pelo `EstudoSelector` para mostrar dropdown com badge ✅ verde (próximo concurso) ou ❌ vermelho (concurso passado).

### Frontend

**Componentes novos** (`src/components/gerador-estudo/`):
- `EstudoSelector.tsx` — dropdown com lista; cada item mostra título curto, "Concurso N" e badge verde/vermelha. Esconde se vier `?postId=` na URL (estudo já travado).
- `EstudoInfoCard.tsx` — card colapsável: título, tema, concurso-alvo, resumo do `fatos_snapshot` (recomendacao_direta), badges das dezenas-chave.

**Componentes reusados** (sem duplicar):
- `QuantidadeSelector`, `DezenasSelector` — reuso direto.
- `ResultadosSheet` — reuso direto (já recebe `estrategia: EstrategiaData`).
- `EstrategiaCard` — reuso direto, alimentado pelo backend.
- `PalpiteCard`, `PalpitesToolbar`, `SelecionarSubpastaDialog`, `salvarPalpites` — todos reusados via `ResultadosSheet`.

**Hook novo** `src/hooks/useGeradorEstudo.ts`:
- Espelha `useGerador` mas chama `generate-palpites-from-estudo`, recebe `postId`, `quantidade`, `qtdDezenas`.
- Hook `useEstudosDisponiveis(loteria)` via React Query → chama `list-estudos-disponiveis`.

**Página nova** `src/pages/lotofacil/GeradorEstudo.tsx`:
- Lê `?postId=` da URL com `useSearchParams`. Se presente → carrega esse estudo direto e esconde seletor.
- Se ausente → mostra `EstudoSelector` com `defaultValue` = primeiro item (mais recente, normalmente verde).
- Layout idêntico ao `Gerador.tsx` mas sem filtros avançados (tema do estudo já é o filtro).
- Reusa `MainLayout`, `ResultadosSheet`, `EstrategiaCard`.

**Rota nova** em `src/App.tsx`:
- `/lotofacil/gerador-estudo` → `<ProtectedRoute><GatedPage feature="gerador"><GeradorEstudo/></GatedPage></ProtectedRoute>`.

**Hub Lotofácil** (`src/pages/lotofacil/HubLotofacil.tsx`):
- Adicionar 1 card "Gerador de Estudo" com ícone `BookOpen`, ao lado do "Gerador IA". Link para `/lotofacil/gerador-estudo`.

**Botão do post** (`src/components/comunidade/GerarPalpitesDoEstudoButton.tsx`):
- Refatorar: remover diálogo inline, virar `Link` para `/lotofacil/gerador-estudo?postId=<id>` (ou `/megasena/gerador-estudo` quando expandir).
- Mantém gate `supported = loteriaTag === "Lotofácil" || "Mega-Sena"`.

### Banco

Migration única:
- `gerador_estudo_daily_usage` (mesma estrutura de `gerador_daily_usage`).
- RLS: SELECT próprio + service role gerencia.
- Função `incrementar_uso_gerador_estudo(p_user_id, p_max)` retornando `remaining_today`.

### Escalabilidade Mega-Sena (próxima rodada, fora desta)

Quando ativar Mega:
1. Criar `src/pages/megasena/GeradorEstudoMegaSena.tsx` (5 linhas: importa `GeradorEstudo` genérico passando `loteria="megasena"`).
2. Card no `HubMegaSena`.
3. Refatorar `GeradorEstudo.tsx` desde já p/ aceitar prop `loteria`, evitando duplicação.

### Decisões confirmadas

| Tópico | Escolha |
|---|---|
| Estratégia | Híbrido: jogos determinísticos + IA Gemini Flash apenas na conclusão (4s timeout, fallback template) |
| Quota | Tabela separada `gerador_estudo_daily_usage` (premium 30/dia, admin ∞, free bloqueado) |
| Navegação | Card no Hub Lotofácil + rota `/lotofacil/gerador-estudo` (preparada p/ Mega) |

### Arquivos tocados

**Migration (1):**
- `supabase/migrations/<ts>_gerador_estudo_quota.sql`

**Edge functions (2):**
- `supabase/functions/generate-palpites-from-estudo/index.ts` (refatorar — `qtd_dezenas`, quota nova, IA na conclusão, payload compatível)
- `supabase/functions/list-estudos-disponiveis/index.ts` (novo)

**Frontend (8):**
- `src/pages/lotofacil/GeradorEstudo.tsx` (novo)
- `src/components/gerador-estudo/EstudoSelector.tsx` (novo)
- `src/components/gerador-estudo/EstudoInfoCard.tsx` (novo)
- `src/hooks/useGeradorEstudo.ts` (novo)
- `src/hooks/useEstudosDisponiveis.ts` (novo)
- `src/components/comunidade/GerarPalpitesDoEstudoButton.tsx` (refatora p/ Link)
- `src/pages/lotofacil/HubLotofacil.tsx` (+1 card)
- `src/App.tsx` (+1 rota)

### Riscos

| Risco | Mitigação |
|---|---|
| IA na conclusão atrasar UX | Timeout agressivo 4s + fallback determinístico imediato |
| Estudo antigo (concurso passado) gerar palpite "fora de hora" | Badge vermelha no seletor + warning no `EstudoInfoCard` ("Este estudo é do concurso N — já realizado") |
| `ResultadosSheet` esperar `lotofacil` hardcoded em algum ponto | Verificado: já usa `loteria` prop via `salvarPalpites`. Reuso seguro. |
| Quota separada confundir usuário | Badge no botão "X/30 estudos hoje" ao lado do "X/Y palpites IA hoje" no Hub |

