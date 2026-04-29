
## Visão geral

Hoje `/admin/whatsapp` concentra templates, fila, logs e disparo manual de WhatsApp. Vamos elevar esse hub para um módulo **Comunicação** que abriga dois canais lado a lado: **WhatsApp** (existente) e **Email Transacional** (novo, via Resend). Os mesmos eventos (`novo_cadastro`, `pix_gerado`, `sale_confirmed`, `lead_pre_checkout_abandono`, `trial_iniciado`, `assinatura_expirada`, `acesso_cortado`) poderão disparar email, WhatsApp ou ambos.

Não vamos usar Lovable Emails (delegação de subdomínio conflita com o domínio atual). Mantemos o padrão Resend já usado em `send-subscription-email`, `enviar-codigo-email`, etc., com `RESEND_API_KEY` que já está configurado e o domínio `palpitetech.com.br` já verificado.

## Navegação (UI)

1. Renomear rota/título visível de "WhatsApp" para **"Comunicação"** mantendo a URL `/admin/whatsapp` (para não quebrar links salvos). Atualizar o `AdminSidebar` para o novo label.
2. No `WhatsAppSubSidebar`, adicionar um **separador de seção** com dois grupos:
   - **WhatsApp**: itens atuais (Instâncias, Proxies, Templates, Fila, Mensagens, Disparo, Logs, Retargeting, Disparo Grupo, Aquecimento, Grupos, Smart Links).
   - **Email**: novos itens — **Templates Email**, **Fila Email**, **Logs Email**, **Disparo Manual Email**.
3. Header/título do tab atualiza com `TAB_TITLES`.

## Banco de dados (migrations)

Tabelas novas, espelhando as de WhatsApp (RLS apenas para admin + service_role):

- **`email_templates`**: `id, name, subject, html, event_trigger, is_active, delay_minutes, include_tags[], exclude_tags[], plan_ids[], tags_match_mode, from_name, reply_to, created_at, updated_at`.
- **`email_queue`**: `id, template_id, recipient_email, recipient_name, variables jsonb, subject_render, html_render, status (pending|sent|failed|skipped), scheduled_at, sent_at, resend_message_id, error_message, retry_count, priority, created_at`. Índice parcial por `status='pending'` ordenado por priority/scheduled_at, e dedupe por `(template_id, recipient_email)` em janela de 7 dias (mesma lógica do `message_queue`).
- **`email_send_logs`**: `id, queue_id, recipient_email, template_id, status, resend_message_id, error_message, created_at` (espelha `send_logs`).
- **`email_suppressions`**: `email PK, reason (bounce|complaint|manual|unsubscribe), created_at` — bloqueia envios para endereços já marcados.

Trigger ou hook nas mesmas funções que hoje enfileiram WhatsApp (eventos Kirvano, novo cadastro, PIX gerado, etc.) para também enfileirar em `email_queue` quando existir `email_template` ativo para o `event_trigger` e o destinatário tiver email válido. Reaproveita os filtros `include_tags`/`plan_ids`.

## Edge Functions

1. **`process-email-queue`** (cron a cada 1 min, padrão WhatsApp): pega lote `pending` (limite 30), renderiza variáveis `{{nome}}`, `{{email}}`, `{{produto}}`, `{{plano_nome}}`, `{{link}}` no `subject` e `html`, envia via Resend (`from: "Palpite Tech <noreply@palpitetech.com.br>"`), grava `resend_message_id`, atualiza status, registra em `email_send_logs`. Em caso de bounce permanente, insere em `email_suppressions`.
2. **`enqueue-email`** (helper interno chamado por outras edges): `{ event_trigger, recipient_email, recipient_name, variables, plan_id, tags }` → resolve template ativo, aplica `delay_minutes`, insere em `email_queue` se não suprimido nem duplicado.
3. **`resend-webhook`** (POST público): recebe `email.bounced`, `email.complained`, `email.delivered`, `email.opened` da Resend. Atualiza `email_send_logs.status` e popula `email_suppressions` em bounces/complaints. Configurado no painel Resend após deploy.
4. Atualizar `handle-kirvano-webhook`, `cadastro-iniciar-email` (apenas em pontos novos — não mexer no fluxo de OTP atual), `receive-lead` e o cron de assinaturas para chamar `enqueue-email` em paralelo ao enfileiramento WhatsApp.

Cron (via `pg_cron` + `pg_net`) no padrão já usado pelo projeto.

## UI dos novos tabs (`src/components/admin/email/`)

- **`EmailTemplatesTab`**: lista, criar/editar (nome, evento, assunto, editor HTML simples com preview, variáveis disponíveis, filtros `include_tags`/`exclude_tags`/`plan_ids`, `delay_minutes`, `is_active`). Estilo idêntico ao `TemplatesTab` do WhatsApp.
- **`EmailFilaTab`**: tabela paginada de `email_queue` com filtros por status/template/destinatário, ações “reenviar” e “cancelar”.
- **`EmailLogsTab`**: tabela de `email_send_logs` com status colorido, busca por email e link para o `resend_message_id`.
- **`EmailDisparoManualTab`**: clone do `DisparoManualTab` atual, mas usa email — filtros por tags/plano/evento, contagem ao vivo, modo Template ou HTML livre, confirmação e enfileiramento em lotes de 500.

Hooks novos: `useEmailTemplates`, `useEmailQueue`, `useEmailLogs`, `useDisparoManualEmail` (refatorando o `useDisparoManual` para um core compartilhado entre canais).

## Resend e domínio

- Reusar `RESEND_API_KEY` já existente (sem `add_secret`).
- Remetente padrão `noreply@palpitetech.com.br` com `reply_to` configurável por template.
- Adicionar footer obrigatório com link “Não quero mais receber” → rota pública `/email/descadastrar?token=...` que insere o email em `email_suppressions` (LGPD).

## Não-objetivos (fora deste escopo)

- Não vamos migrar para Lovable Emails (mantemos Resend conforme pedido).
- Não vamos criar campanhas de marketing/newsletter — somente transacionais disparados por evento ou disparo manual segmentado.
- Não vamos mexer no fluxo OTP de cadastro/recuperação atual.

## Etapas de implementação (ordem)

1. Migration: criar tabelas `email_templates`, `email_queue`, `email_send_logs`, `email_suppressions` + RLS + índices + dedupe.
2. Edge functions `enqueue-email`, `process-email-queue`, `resend-webhook` + cron.
3. Integrar `enqueue-email` nos pontos atuais que disparam WhatsApp (Kirvano, novo cadastro, PIX, leads).
4. Renomear módulo para “Comunicação”, reorganizar sub-sidebar em duas seções.
5. Implementar `EmailTemplatesTab`, `EmailFilaTab`, `EmailLogsTab`, `EmailDisparoManualTab` + hooks.
6. Página pública de unsubscribe.
7. Seed: criar templates de email iniciais espelhando os 11 do WhatsApp (assinatura vencida, PIX gerado, compra aprovada, lead pré-checkout, trial expirando, etc.) reaproveitando o HTML do `send-subscription-email`.

Quer que eu prossiga assim? Se preferir começar só pelo MVP (passos 1, 2, 5 e 7 sem integrar ainda nos webhooks), me avise.
