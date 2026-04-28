## Objetivo

Adicionar suporte multi-loteria nos 2 tipos de mensagem que dependem da loteria (IA do post + Palpite). Por enquanto: **Lotofácil** e **Mega-Sena**.

- **Tipo "Gerada por IA"** → IA gera baseada no post mais recente da **loteria selecionada** (filtro por `postagens.loteria_tag`).
- **Tipo "Palpite"** → seleciona a loteria; usa o motor determinístico V3 (`gerarPalpitesDeterministicos`) compartilhado, mesma formatação de mensagem, mantendo o toggle "Com Palpites" / "Só Estratégia + CTA" — agora **por loteria** (cada loteria tem seu link VIP/CTA).
- **Tipo "Manual"** → segue como está (não depende de loteria).

## UI — Card de Configuração / Slot

No diálogo de slot, ao escolher tipo `IA` ou `Palpite`, exibir um seletor de loteria com 2 opções:
- 🍀 Lotofácil
- 💚 Mega-Sena

(Default: `lotofacil` para retrocompatibilidade.)

Ajustes:
- Bloco "Modo Palpite" deixa de ser único — torna-se **um bloco por loteria usada em algum slot palpite**, com seu próprio toggle "Com Palpites / Só Estratégia + CTA" e seu próprio campo "Link do Grupo VIP".
- Badge no card da config mostra a loteria de cada slot (ex.: "🤖 IA · Lotofácil", "🎰 Palpite · Mega-Sena").

## Backend — Esquema

Adicionar campos por slot (dentro do JSON `slots`) e novo objeto por loteria em `group_blast_configs`:

```ts
Slot {
  id, schedule_times, last_scheduled_index,
  message_type: "ai" | "manual" | "palpite",
  message_content,
  loteria?: "lotofacil" | "megasena"   // NOVO (default "lotofacil")
}

group_blast_configs {
  ...,
  // NOVO: configuração por loteria (substitui include_palpites + vip_group_link no UI)
  palpite_settings?: {
    lotofacil?: { include_palpites: boolean, vip_group_link: string | null },
    megasena?:  { include_palpites: boolean, vip_group_link: string | null }
  }
}
```

`include_palpites` e `vip_group_link` (colunas existentes) permanecem como **fallback retrocompatível** para configs antigas (Lotofácil).

Não há migration de schema — `slots` é JSONB e `palpite_settings` será novo campo JSONB. Vou adicionar a coluna `palpite_settings jsonb` via migration leve.

## Backend — Edge Functions

### `_shared/group-blast/lottery-config.ts` (NOVO)
Mapa central:
```ts
{ lotofacil: { slug, label, loteriaTag: "Lotofácil", qtdDezenas: 15, periodoAnalise: 5, hubPath: "/lotofacil" },
  megasena:  { slug, label, loteriaTag: "Mega-Sena", qtdDezenas: 6,  periodoAnalise: 10, hubPath: "/mega-sena" } }
```

### `_shared/group-blast/palpite-message.ts` (refatorar)
- Aceita `loteria: "lotofacil" | "megasena"`.
- Substitui geração via tool-call por **chamada ao motor determinístico** (`gerarPalpitesDeterministicos` de `_shared/gerador/pipeline.ts`) — garante o **mesmo motor V3** usado em `/gerador` e `/gerador-megasena`. Resultado já vem com `jogos` e `estrategia` ricos.
- Busca `resultados_loterias` filtrando por `loteria` da config.
- Mantém o mesmo formato de mensagem (cabeçalho, último resultado, ferramentas, dezenas priorizadas/evitadas, filtros, conclusão, jogos / CTA-VIP).
- UTM/link usam `hubPath` da loteria (ex.: `/lotofacil` ou `/mega-sena`).

### `_shared/group-blast/ai-message.ts` (refatorar)
- Aceita `loteria` como parâmetro.
- `fetchLatestPost` passa a filtrar por `postagens.loteria_tag = config.loteriaTag`.
- Prompt e link UTM usam o `hubPath` da loteria.

### `_shared/group-blast/send.ts` (refatorar)
- Em `resolveMessageContent`: lê `slot.loteria ?? "lotofacil"`.
- Para `palpite`: lê `configData.palpite_settings?.[loteria]` com fallback para `include_palpites`/`vip_group_link` legados.
- Para `ai`: passa a loteria para `generateAIMessage` (que filtra `loteria_tag`).
- Fallback IA quando palpite falha mantém a mesma loteria.

### `prepare.ts` / `send-now.ts`
Sem mudanças estruturais — o slot já carrega o tipo e agora também a loteria.

## UI — Frontend

### `DisparoGrupoTab.tsx`
- `Slot` interface ganha `loteria?: "lotofacil" | "megasena"` (default `lotofacil`).
- `BlastConfig` ganha `palpite_settings`.
- Em cada slot do form (tipos `ai` e `palpite`): novo `Select` com Lotofácil / Mega-Sena.
- Substituir o bloco único "Modo Palpite Lotofácil" por **uma seção por loteria** referenciada pelos slots palpite (renderiza dinamicamente):
  - Toggle "🎰 Com Palpites" / "📊 Só Estratégia + CTA"
  - Campo "Link do Grupo VIP <Loteria>" quando "Só Estratégia"
- No save: persistir `slots[].loteria` e `palpite_settings`. Manter `include_palpites`/`vip_group_link` espelhando os valores da Lotofácil para retrocompatibilidade.
- Badges no card visualizando a loteria de cada slot.

### Texto de ajuda
Atualizar legendas: "🎰 Palpite Lotofácil" → "🎰 Palpite (loteria selecionada)"; "Gera 15 palpites …" → "Gera palpites com estratégia baseada nos últimos concursos da loteria escolhida".

## Arquivos a tocar

Novos:
- `supabase/functions/_shared/group-blast/lottery-config.ts`
- `supabase/migrations/<timestamp>_group_blast_palpite_settings.sql` (adiciona coluna `palpite_settings jsonb default '{}'`)

Editados:
- `supabase/functions/_shared/group-blast/types.ts` (Slot ganha `loteria`)
- `supabase/functions/_shared/group-blast/palpite-message.ts` (multi-loteria + motor V3)
- `supabase/functions/_shared/group-blast/ai-message.ts` (filtro por loteria_tag)
- `supabase/functions/_shared/group-blast/send.ts` (lê slot.loteria + palpite_settings)
- `src/components/admin/whatsapp/DisparoGrupoTab.tsx` (UI multi-loteria + settings por loteria)

Deploy: `group-blast-send`.

## Considerações

- **Consistência**: o palpite agora usa o mesmo motor determinístico V3 que o app usa nos geradores oficiais → mesma estratégia, mesmo padrão visual de mensagem.
- **Retrocompatibilidade**: configs sem `slot.loteria` defaultam para Lotofácil; configs sem `palpite_settings` usam `include_palpites`/`vip_group_link` antigos.
- **Mensagem**: o template (cabeçalho, ferramentas, dezenas, filtros, conclusão, CTA) é idêntico — só muda título ("Lotofácil" vs "Mega-Sena"), número de dezenas por jogo (15 vs 6) e link UTM.
