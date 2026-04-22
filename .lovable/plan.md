

# Template "PIX Gerado" + link grupo VIP em Compra Aprovada

## 1. Rota mascarada `/gerar-novo-pix/:slug`

Nova página `src/pages/GerarNovoPix.tsx` registrada em `App.tsx` que recebe um slug de plano (`grupo-vip-lotofacil`, `mensal`, `anual`, `plano-anual-vip`), consulta `plans.checkout_link` no Supabase e redireciona via `window.location.replace`.

- Tela mínima (logo + spinner + "Redirecionando para o pagamento seguro…") por 1s antes do redirect, para o usuário ver o domínio palpitetech.com.br carregando.
- Slug inválido → mostra fallback com link para `/planos`.
- Não exige autenticação (público).
- URL final: `https://www.palpitetech.com.br/gerar-novo-pix/grupo-vip-lotofacil`.

## 2. Novo template "PIX Gerado" (1 mensagem com quebra dupla)

Criar em `message_templates`:

- **Nome:** `PIX Gerado - Pagamento pendente`
- **event_trigger:** `pix_gerado` (já existe e dispara via trigger automática quando webhook Kirvano grava o evento)
- **delay_enabled:** `false` · **delay_minutes:** `0` (envio imediato)
- **is_active:** `true`
- **Sem segmentação** (sem tags/planos restritos)

**Conteúdo principal** (com `\n\n---\n\n` separando bloco do código PIX):

```
Olá {{nome}}, você está pertinho de receber todos os dias 15 palpites quentes da Lotofácil direto no seu WhatsApp 🍀

Seu PIX de {{produto}} ({{valor}}) já foi gerado. Faça o pagamento e o acesso ao grupo VIP é liberado na hora.

Caso queira gerar um novo PIX ou trocar a forma de pagamento:
{{link_novo_pix}}

---

Código PIX copia e cola:
{{pix_codigo}}
```

**10 variações** (geradas com leves trocas de abertura, ordem e tom — sempre preservando `{{nome}} {{produto}} {{valor}} {{link_novo_pix}} {{pix_codigo}}` e o separador `---` entre os dois blocos). Todas via `generate-message-variants`.

## 3. Novas variáveis no engine de templates

A trigger `trigger_queue_event_templates` hoje injeta `nome / telefone / email / produto / plano_nome / link_grupo_vip`. Vou expandir para também produzir:

- `{{valor}}` → `total_price` do payload Kirvano (formatado `R$ XX,XX`), passado em `events.metadata.total_price` pelo webhook
- `{{link_novo_pix}}` → derivado do slug do plano: `https://www.palpitetech.com.br/gerar-novo-pix/<slug>` (lookup `plans.slug` via `plan_id` ou via offer mapping)
- `{{pix_codigo}}` → `qrcode` do payload Kirvano, passado em `events.metadata.pix_codigo`

**Webhook (`handle-kirvano-webhook/index.ts`)** será ajustado para gravar esses campos em `events.metadata` quando registrar `pix_gerado`:

```ts
await insertEvent(perfilIgnore.id, "pix_gerado", {
  payment_method, total_price,
  pix_codigo: payload?.payment?.qrcode ?? null,
  pix_expires_at: payload?.payment?.expires_at ?? null,
  plan_slug: <slug resolvido via offer_id>,
});
```

**Trigger SQL (`trigger_queue_event_templates`)** atualizada para ler do `metadata` e do `plans.slug`, montando `link_novo_pix` e formatando `valor`.

## 4. Atualização dos templates "Compra Aprovada"

Editar os 2 templates existentes para incluir o link do grupo VIP de assinantes:

- **`Compra aprovada (Acesso ao App)`** → adicionar bloco antes do "Bons palpites":
  ```
  🎁 *Bônus exclusivo:* entre no nosso grupo VIP de assinantes para receber palpites diários da equipe:
  https://www.palpitetech.com.br/g/grupo-vip-assinantes
  ```
- **`Compra aprovada (Grupo VIP Lotofácil)`** → o `{{link_grupo_vip}}` já está lá, mas hoje ele é puxado de `group_blast_configs.vip_group_link`. Vou **fazer UPDATE em `group_blast_configs`** setando `vip_group_link = 'https://www.palpitetech.com.br/g/grupo-vip-assinantes'` no config ativo mais antigo.

Também regenero variações desses 2 templates (se houver) preservando o novo link.

## 5. Detalhes técnicos

**Arquivos novos/alterados:**

- `src/pages/GerarNovoPix.tsx` (novo) — página de redirect público
- `src/App.tsx` — registrar rota `/gerar-novo-pix/:slug` (pública, fora do `ProtectedRoute`)
- `supabase/functions/handle-kirvano-webhook/index.ts` — incluir `pix_codigo`, `total_price` formatado e `plan_slug` resolvido no `metadata` do evento `pix_gerado`
- **Migration:** atualizar `trigger_queue_event_templates` adicionando as 3 variáveis novas (`valor`, `link_novo_pix`, `pix_codigo`) ao `jsonb_build_object`

**Operações de dados (insert tool, sem migration):**
- INSERT do template `PIX Gerado - Pagamento pendente`
- INSERT das 10 variações em `message_template_variants`
- UPDATE dos 2 templates de compra aprovada
- UPDATE em `group_blast_configs` para setar `vip_group_link`

**Fluxo end-to-end do PIX:**
```text
Cliente gera PIX no Kirvano
  → webhook handle-kirvano-webhook (ev=pix_generated, action=ignore)
  → INSERT events (event_type=pix_gerado, metadata={pix_codigo, valor, plan_slug, ...})
  → trigger_queue_event_templates dispara
  → queue_templates_for_event busca templates com event_trigger=pix_gerado
  → INSERT em message_queue com variables resolvidas
  → process-queue (cron) envia via Evolution API em ~30s
```

Como o template `Compra Aprovada` também dispara automaticamente em `sale_confirmed` (via mesma trigger), quando o cliente paga ele recebe primeiro a confirmação e logo depois a mensagem de boas-vindas com link do grupo VIP — exatamente o comportamento desejado.

## Fora de escopo

- Tracking de clique no `/gerar-novo-pix/:slug` (pode ser adicionado depois com analytics).
- Disparo de **2 mensagens separadas** para o código PIX (preferimos 1 mensagem com `---`, conforme aprovado).
- Trocar o link do grupo VIP em outras tabelas/configs além de `group_blast_configs`.

