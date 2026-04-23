

## Pré-geração de posts + Gerador "baseado no estudo" + Gravação Estudos

### Resposta direta às 3 perguntas

**1. Quando os posts são gerados hoje?**
**No exato momento da postagem.** O `process-scheduled-posts` roda de hora em hora, encontra o slot do horário (ex: Lotofácil `analise_moldura` às 10:00), chama `generate-guide-post`, que calcula fatos + chama IA + valida + insere em `postagens`. Se a IA demorar 8s, o post sai 8s depois do horário. **Nada é pré-computado.**

**2. Dá para pré-gerar logo após o resultado oficial?** Sim, e é a melhor jogada. O sorteio sai → `sync-lotofacil` / `sync-megasena` grava o resultado → disparamos a pré-geração de **todos os posts do dia seguinte** em background. Eles ficam armazenados em estado "rascunho" e são apenas **publicados** no horário agendado (operação barata, sem IA).

**3. Gerador "baseado no estudo" precisa do post pronto?** Sim. Se o post já existe quando o usuário toca em "Gerar palpites baseado nesse estudo", o gerador recebe os **fatos determinísticos do estudo** (não o texto da IA) e produz palpites alinhados ao tema (ex: estudo de Moldura → palpites com 8 dezenas da moldura).

---

### Arquitetura proposta (escalável p/ N loterias)

```text
┌──────────────────────────────────────────────────────────────────┐
│ FLUXO ATUAL (síncrono)                                           │
│ cron 1h → process-scheduled-posts → generate-guide-post (IA) →   │
│           insere em postagens (status=publicado)                 │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ FLUXO NOVO (assíncrono em 2 fases)                               │
│                                                                  │
│ FASE 1 — PRÉ-GERAÇÃO (dispara 1× ao dia, após resultado)         │
│   sync-lotofacil/sync-megasena grava resultado                   │
│        ↓                                                         │
│   precompute-daily-posts (NOVA edge function)                    │
│        ↓                                                         │
│   Para cada (loteria, tipo_post) ativo no post_schedules:        │
│     • monta fatos determinísticos (engine)                       │
│     • gera conteúdo IA + valida                                  │
│     • salva em postagens com status='rascunho',                  │
│       publicar_em=<horário do schedule>,                         │
│       fatos_snapshot=<JSON dos fatos>                            │
│                                                                  │
│ FASE 2 — PUBLICAÇÃO (cron horário, barato)                       │
│   process-scheduled-posts:                                       │
│     • Se já existe rascunho pronto p/ o slot → muda status para  │
│       'publicado' (1 UPDATE, sem IA)                             │
│     • Se NÃO existe (fallback) → gera na hora como hoje          │
└──────────────────────────────────────────────────────────────────┘
```

### Mudanças por arquivo

**1. Migration: campos novos em `postagens`**
- `status text default 'publicado'` — `'rascunho' | 'publicado'`
- `publicar_em timestamptz` — quando o rascunho deve virar público
- `fatos_snapshot jsonb` — JSON serializado da `Fatos` da engine (resumo, recomendacaoDireta, extras + dezenas-chave do tema). É o que o gerador usa.
- `tema_estudo text` — duplica `tipo` para query rápida pelo gerador.
- Índice parcial `(status, publicar_em)` para o cron achar rascunhos prontos.
- Filtro automático no feed Estudos: `WHERE status = 'publicado'`.

**2. Nova edge function: `precompute-daily-posts`**
- Recebe `{ loteria }`. Lê `post_schedules` ativos da loteria.
- Para cada `tipo_post`: roda a mesma lógica de `generate-guide-post` mas força `status='rascunho'` e grava `publicar_em` = data de hoje + horário do schedule (BRT).
- Se já existir rascunho/publicado do mesmo dia → pula (idempotente, pode rodar 2x sem duplicar).
- **Salva `fatos_snapshot` no insert** (extra crítico p/ o gerador).

**3. Disparo automático (sem cron extra)**
- No final de `sync-lotofacil/index.ts` e `sync-megasena/index.ts`, depois do `criarPostResultadoOficial`, fazemos `fetch` para `precompute-daily-posts` em fire-and-forget. Toda loteria nova herda só ligando essa chamada no seu `sync-*`.

**4. `process-scheduled-posts` — virar publicador**
- Para cada slot do horário atual:
  - `SELECT id FROM postagens WHERE status='rascunho' AND tema_estudo=tipo AND loteria_tag=tag AND publicar_em <= now()`
  - Se achou → `UPDATE postagens SET status='publicado', created_at=now()`. **Não chama IA.**
  - Se não achou → fallback no fluxo antigo (`generate-guide-post` síncrono).

**5. Refatoração mínima em `generate-guide-post`**
- Aceitar parâmetro `{ status: 'rascunho' | 'publicado', publicar_em?: string }`.
- Sempre persistir `fatos_snapshot` (custo zero — já temos os `fatos` em memória).
- Lock de duplicação passa a olhar `(status='publicado' OR rascunho do mesmo dia)`.

**6. Nova edge function: `generate-palpites-from-estudo`**
- Recebe `{ post_id }`. Carrega `postagens.fatos_snapshot` + `loteria_tag` + `tema_estudo`.
- Reusa engine de palpites V3 (Lotofácil/Mega/Quina) injetando **filtros automáticos vindos do tema**:
  - `analise_moldura` → fixar X dezenas da moldura como "preferenciais"
  - `analise_repetidas` → forçar N repetidas do último concurso
  - `analise_movimentacao` → puxar quentes do snapshot
  - `analise_linhas/colunas/posicoes_*` → balanço por linha/coluna conforme estudo
- Mesmo limite diário e mesmo gating premium do gerador atual.
- Retorna `{ jogos, estrategia, baseado_em: { post_id, tema, titulo } }`.

**7. Frontend — botão no `PostDetalhes`**
- Logo após `FormattedContent`, antes do `ActionBar`, renderizar `<GerarPalpitesDoEstudoButton postId tema loteria />`.
- O botão chama `generate-palpites-from-estudo`, abre o `ResultadosSheet` apropriado (Lotofácil/Mega) já existente, com badge "Estudo: Moldura — Lotofácil 3668".

**8. Admin Gravação — submenu**
- Em `src/components/layout/AdminSidebar.tsx`, transformar a entrada "Gravação" em `NavGroup` colapsável com 2 sub-itens:
  - `/admin/gravacao/resultado/:loteria` — atual `GravacaoLotofacil`/`GravacaoQuina` (renomear rotas, manter conteúdo).
  - `/admin/gravacao/estudos/:loteria` — **novo shell** `GravacaoEstudos` que lista os rascunhos do dia (`status='rascunho'` da loteria) e renderiza cada um como slide. Como os posts já estão pré-gerados, abrir a tela é instantâneo. A temática visual fica para depois (placeholder dark com cor da loteria).

### Por que isso funciona p/ qualquer loteria futura

- A engine continua sendo a única coisa que cada loteria precisa implementar (`tiposSuportados()` define os temas).
- `precompute-daily-posts` é **agnóstica de loteria** — só lê `post_schedules`.
- `generate-palpites-from-estudo` é **agnóstica de loteria** — escolhe o gerador V3 pelo `loteria_tag` e aplica filtros pelo `tema_estudo`.
- Adicionar Quina/Dupla Sena = criar engine + chamar `precompute-daily-posts` no fim do `sync-quina/sync-duplasena`. Zero código extra no fluxo de publicação ou no botão do post.

### Ganhos imediatos

| Antes | Depois |
|---|---|
| Post sai com 5-15s de delay (IA) | Post sai instantâneo (UPDATE) |
| Falha de IA na hora deixa slot vazio | Falha detectada de manhã, com tempo p/ retry |
| Gravação Estudos teria que esperar IA gerar | Abre instantâneo, conteúdo já pronto |
| Gerador do estudo precisaria recalcular fatos | Lê `fatos_snapshot` do post (1 SELECT) |
| Custo IA distribuído ao longo do dia | Custo concentrado de manhã, mais previsível |

### O que NÃO muda

- Estrutura modular dos engines (`_shared/guide-post/*`).
- Whitelist anti-alucinação, fallback determinístico, dedup.
- Personas (Augusto continua cobrindo Lotofácil + Mega).
- Rodapé universal "Próximo Concurso" e glossário "Quente/Fria".
- Frontend de feed Estudos (só ganha filtro `status='publicado'`).
- Geradores atuais (Lotofácil/Mega/Quina/Dupla Sena) — `generate-palpites-from-estudo` é função nova, paralela.

### Pontos de atenção

| Risco | Mitigação |
|---|---|
| Sorteio não cair no dia (acumulou sem novo resultado) | `precompute-daily-posts` também roda via cron diário 04:00 BRT como rede de segurança. |
| Rascunho falhar p/ 1 tipo | Os outros tipos seguem; cron horário cobre o tipo faltante gerando ao vivo. |
| Limite de caracteres / whitelist mudar | Só afeta novos rascunhos do dia seguinte; já-publicados intactos. |
| Gerador do estudo "vazar" tema entre loterias | `fatos_snapshot` carrega `loteria_tag`; gerador valida match antes de rodar. |
| Custo IA dobrar por gerar 2x (rascunho + fallback) | Lock idempotente: rascunho do dia bloqueia geração extra. |

### Ordem de implementação sugerida

1. Migration `postagens` (status / publicar_em / fatos_snapshot / tema_estudo).
2. Refatorar `generate-guide-post` p/ aceitar `status` e gravar `fatos_snapshot`.
3. Criar `precompute-daily-posts` + chamar nos `sync-lotofacil`/`sync-megasena`.
4. Atualizar `process-scheduled-posts` p/ virar publicador.
5. Criar `generate-palpites-from-estudo` + botão no `PostDetalhes`.
6. Submenu Gravação no AdminSidebar + página `GravacaoEstudos` (placeholder).
7. Definir temática visual da Gravação Estudos (próxima conversa).

