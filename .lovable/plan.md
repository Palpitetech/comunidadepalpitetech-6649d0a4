## Objetivo

Criar **um template de PIX gerado por produto** (cada um com 10 variações), que dispare imediatamente após o webhook `PIX_GENERATED` e que **não envie** se o cliente já tiver pago antes do momento do disparo.

## Produtos cobertos (ofertas Kirvano ativas hoje)

| Produto / Plano | offer_id Kirvano | Link "Gerar novo PIX" |
|---|---|---|
| Grupo VIP Lotofácil | `19990908-…490b` | `palpitetech.com.br/gerar-novo-pix/grupo-vip-lotofacil` |
| Mensal | `153917c3-…574a7e` | `…/gerar-novo-pix/mensal` |
| Semestral | `0576ad87-…72014` | `…/gerar-novo-pix/semestral` |
| Anual | `c1078d80-…6a0ee` | `…/gerar-novo-pix/anual` |

> Hoje só existe **um** template `pix_gerado` genérico que dispara para todo mundo. Vamos substituí-lo por 4 templates direcionados.

## Arquitetura existente (não muda)

- Webhook Kirvano grava em `events` com `event_type='pix_gerado'` e `metadata` contendo `plan_slug`, `pix_codigo`, `total_price`.
- Trigger `trigger_queue_event_templates` monta `variables` (incluindo `plan_slug`, `link_novo_pix`, `pix_codigo`, `valor`, `nome`, `produto`) e chama `queue_templates_for_event`, que enfileira **todos** os templates ativos do evento.
- `process-queue` envia, picando uma das 10 variantes via `pick_template_variant`.

## O que muda

### 1. Filtro por oferta no template (DB)

`message_templates` já tem `plan_ids[]`, mas hoje ele filtra pelo `perfis.plan_id` — que só é gravado **após pagamento aprovado**. No PIX gerado o usuário ainda não tem `plan_id`. Solução: estender `should_send_template` para também aceitar match via `variables.plan_slug` quando o evento for `pix_gerado` (e correlatos).

Lógica nova dentro de `should_send_template` (apenas adicionada, não quebra o existente):

```text
se template.plan_ids vazio  → passa
se perfis.plan_id casa      → passa (comportamento atual)
se variables.plan_slug bate com algum plans.slug em template.plan_ids → passa
caso contrário              → bloqueia
```

Para isso, `should_send_template` precisa receber `p_variables jsonb` (nova assinatura). Atualizamos:
- `should_send_template(template_id, user_id, variables)` (nova)
- `queue_templates_for_event` passa `p_variables` adiante
- `queue_email_templates_for_event` idem (mesmo filtro vale para email)

### 2. Skip "já pago" no envio (process-queue)

Antes de marcar como `sent`, o `process-queue` verifica, **só para mensagens de templates com `event_trigger='pix_gerado'`**:

```text
existe em events um registro com event_type='compra_aprovada' (ou 'sale_confirmed')
  para o mesmo user_id (resolvido por phone do recipient)
  criado APÓS o created_at deste item da fila?
→ se sim, marca status='skipped_paid' e não envia.
```

Implementação: query única em `events` por `user_id + event_type IN (compra_aprovada, sale_confirmed) + created_at > queue.created_at`. Resolvemos `user_id` via `perfis.celular = recipient_phone` (existe índice).

### 3. Criar os 4 templates + 10 variantes cada

Para cada um dos 4 planos: `INSERT` em `message_templates` (event_trigger=`pix_gerado`, `plan_ids={plan_id}`) + 10 `INSERT` em `message_template_variants` (positions 1–10) com texto humanizado, sem citar tom robótico, com `{{nome}}`, `{{pix_codigo}}` e `{{link_novo_pix}}`.

**Template base do usuário (variação 1, ajustada por produto):**

```
Olá {{nome}}, seus 15 palpites quentes de Lotofácil já estão a um passo!
Estou no contato para facilitar o recebimento — segue abaixo o seu PIX
para concluir o pagamento.

PIX (copia e cola):
{{pix_codigo}}

Caso queira gerar um novo PIX:
{{link_novo_pix}}
```

As 10 variantes mudam apenas tom/abertura/CTA (mantendo as mesmas variáveis), por produto:

- Grupo VIP Lotofácil → fala de "15 palpites quentes da Lotofácil"
- Mensal / Semestral / Anual → fala em "acesso completo da Comunidade" e benefícios do plano

### 4. Desativar (não deletar) o template antigo

`UPDATE message_templates SET is_active=false WHERE id='5730df1c-…6625'` para não duplicar mensagem.

## Mudanças técnicas (resumo)

1. **Migration**:
   - Nova versão de `should_send_template(uuid, uuid, jsonb)` com lookup adicional por `plan_slug` em `variables`.
   - Atualizar `queue_templates_for_event` e `queue_email_templates_for_event` para repassar `p_variables`.
2. **process-queue** (`supabase/functions/process-queue/index.ts`):
   - Antes do envio, se `template.event_trigger='pix_gerado'`, consulta `events` por compra aprovada posterior ao `created_at` do item. Se houver → marca `status='skipped_paid'` com `error_message='compra ja aprovada'`.
3. **Insert (data, via tool de insert)**:
   - 4 linhas em `message_templates` (uma por plano, com `plan_ids={plan_id}`).
   - 40 linhas em `message_template_variants` (10 por template).
   - `UPDATE` desativando o template `pix_gerado` genérico atual.

## Fora de escopo

- Não muda nada no webhook handler (já popula `plan_slug`, `pix_codigo` e `total_price` corretamente).
- Não cria novo evento — reutiliza `pix_gerado`.
- Não toca em emails: o mesmo filtro nasce funcionando para `queue_email_templates_for_event`, mas **não** vamos criar templates de email agora (apenas WhatsApp, conforme pedido).
