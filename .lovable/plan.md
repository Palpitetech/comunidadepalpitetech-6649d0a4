
# Plano — Email Transacional automático por evento

## Descoberta importante

Os webhooks (`handle-kirvano-webhook`, `cadastro-finalizar`, `handle-subscription-expiration`, `promote-lead-to-user`, etc.) **não chamam o WhatsApp diretamente**. Eles inserem em `public.events`, e o trigger `trigger_queue_event_templates` chama `queue_templates_for_event(...)`, que enfileira em `message_queue` para todos os templates ativos com aquele `event_trigger`.

Vamos **reaproveitar essa mesma arquitetura desacoplada**: criar uma função gêmea para email, acionada pelo mesmo trigger. Resultado: **zero alteração nos webhooks** — todo evento já registrado dispara WhatsApp **e** email simultaneamente.

---

## Etapa 1 — Backend: pipeline de eventos → email

### 1.1 Função `queue_email_templates_for_event`
Espelho de `queue_templates_for_event` mas para email:
- recebe `event_trigger`, `email`, `nome`, `user_id`, `variables jsonb`, `priority`
- itera em `email_templates WHERE event_trigger = ? AND is_active = true`
- valida supressão (`email_suppressions`), respeita `delay_minutes`, `include_tags`/`exclude_tags`/`plan_ids`
- renderiza `subject` e `html` substituindo `{{variavel}}` no momento do enfileiramento (snapshot)
- insere em `email_queue` (a constraint EXCLUDE atual já cuida do dedupe 7d)

### 1.2 Atualizar `trigger_queue_event_templates`
Adicionar uma chamada extra ao final:
```sql
IF v_perfil.email IS NOT NULL AND v_perfil.email <> '' THEN
  PERFORM public.queue_email_templates_for_event(
    NEW.event_type, v_perfil.email, v_perfil.nome,
    v_perfil.id, v_variables, v_priority
  );
END IF;
```
Mantém o fluxo WhatsApp intocado. Mesma lista de variáveis (`{{nome}}`, `{{email}}`, `{{produto}}`, `{{valor}}`, `{{link_novo_pix}}`, `{{pix_codigo}}`, `{{link_grupo_vip}}`, `{{link_sala_secreta_mega}}`, `{{link_sala_vip_mega}}`).

### 1.3 Hardening do `process-email-queue`
Revisar se já renderiza variáveis no momento do envio; se sim, manter snapshot da etapa 1.1 como fallback. Garantir retry com backoff e marcação de `bounce`/`complaint` em `email_suppressions` via `resend-webhook`.

---

## Etapa 2 — Auditoria template-a-template (WhatsApp → Email)

Para cada template WhatsApp ativo, criar a versão email correspondente. Email tem mais espaço e formato HTML, então cada template ganha:
- **Cabeçalho** com logo/cor da marca
- **CTA principal grande** (botão) levando à ação esperada
- **Bloco de credenciais** quando aplicável (login, senha temporária)
- **Rodapé** com suporte WhatsApp (51 98185-4281) + link unsubscribe (já injetado pela infra)

| # | Evento (`event_trigger`)     | Template WhatsApp atual                       | Template Email a criar                                        | CTA principal                          | Delay |
|---|------------------------------|-----------------------------------------------|---------------------------------------------------------------|----------------------------------------|-------|
| 1 | `novo_cadastro`              | "Cadastro Comunidade" (imediato)              | **Boas-vindas Palpite Tech** — credenciais, tour rápido       | Acessar minha conta                    | 0     |
| 2 | `novo_cadastro`              | "Lembrete verificar email" (60 min)           | **Confirme seu email — libere o teste grátis de 3 dias**      | Reenviar código de verificação         | 60    |
| 3 | `pix_gerado`                 | "PIX Gerado" (imediato)                       | **Seu PIX está pronto — finalize em minutos**                 | Pagar agora / Copiar código PIX        | 0     |
| 4 | `sale_confirmed`             | "Compra aprovada (Acesso ao App)" (imediato)  | **Pagamento confirmado — acesso liberado**                    | Entrar no app + Entrar no grupo VIP    | 0     |
| 5 | `sale_confirmed`             | "Compra aprovada — Aula Mega VIP"             | **Sua vaga na Sala VIP da Mega-Sena está garantida**          | Entrar na sala VIP                     | 0     |
| 6 | `assinatura_expirada`        | "Assinatura vencida" (imediato)               | **Sua assinatura venceu — renove com condição especial**      | Renovar com desconto                   | 0     |
| 7 | `acesso_cortado`             | "Reativação 7 dias após corte" (10080 min)    | **Sentimos sua falta — volte com benefícios**                 | Reativar minha conta                   | 10080 |
| 8 | `lead_pre_checkout_abandono` | "Lead pré-checkout - Sala Secreta Lotofácil"  | **Sua vaga no Grupo VIP Lotofácil está reservada — finalize** | Concluir pagamento (link Kirvano)      | 5     |
| 9 | `lead_pre_checkout_abandono` | "Lead Maratona Mega 30 Anos — Sala Secreta"   | **Entre na Sala Secreta da Mega-Sena (gratuito)**             | Entrar no grupo gratuito               | 60    |

Total: **9 templates email**, mesmos `event_trigger`, mesmos `delay_minutes`, mesmos filtros de plano/tag — paridade 1:1 com WhatsApp.

### Padrão visual de cada template (HTML)
- Largura 600px, fundo `#0F172A` (Navy) no header, corpo branco
- Tipografia Arial 16px, headings 22px (segue Senior UX)
- Botão CTA: `#10B981` (Success), 14px padding, border-radius 8px, link absoluto rastreável (UTM `utm_source=email&utm_medium=transactional&utm_campaign={{event}}`)
- Dois CTAs no máximo por email (primário + secundário "falar no WhatsApp")
- Preheader text customizado por template
- Sem referências a "AI" (Core memory): usar "Análise técnica", "Estatística"

---

## Etapa 3 — Seed dos templates no banco

Migration que faz `INSERT ... ON CONFLICT (name) DO UPDATE` (ou `DELETE` dos 5 inativos atuais + insert dos 9 novos) com:
- `is_active = true`
- `from_name = 'Palpite Tech'`
- `reply_to = 'suporte@palpitetech.com.br'` (ou null)
- `subject` e `html` versionados (HTML completo inline, ~150-300 linhas por template)

Após seed, todos os eventos novos disparam email automaticamente.

---

## Etapa 4 — UI: revisão na aba "Comunicação → Email"

- **EmailTemplatesTab**: já existe; só garantir que o seletor de evento mostre exatamente os mesmos 7 valores usados no trigger (`novo_cadastro`, `pix_gerado`, `sale_confirmed`, `assinatura_expirada`, `acesso_cortado`, `lead_pre_checkout_abandono`, `trial_iniciado`). Adicionar dica visual “este evento já dispara WhatsApp também”.
- **EmailFilaTab**: adicionar coluna “Evento” (via join template) e badge de status colorido igual à fila WhatsApp.
- **EmailLogsTab**: link “ver mensagem WhatsApp correspondente” quando existir entrada em `send_logs` para o mesmo `user_id` + janela de 1 min.
- Banner no topo da seção Email: “Os mesmos eventos disparam WhatsApp e Email em paralelo. Desativando o template aqui, só o email pára.”

---

## Etapa 5 — Validação e QA

1. **Teste em sandbox**: inserir manualmente um evento `pix_gerado` para um perfil de teste com email válido → confirmar que aparece em `email_queue` e é enviado em <1 min.
2. **Teste de cada gatilho real** (novo cadastro, PIX, compra aprovada via webhook Kirvano de teste, expiração via cron de assinatura, lead pré-checkout via `process-lead-retargeting`).
3. **Inspecionar HTML em 3 clientes** (Gmail web, iOS Mail, Outlook web) renderizando via `process-email-queue` em modo dry-run (rota local de preview já existente em `EmailTemplatesTab`).
4. **Suppression**: enviar para email inválido controlado, esperar `resend-webhook` registrar bounce, confirmar próximo evento ser pulado.
5. **Dedupe**: disparar duas vezes o mesmo evento em 1 min → segundo não deve ser enviado (constraint `email_queue_dedupe_7d_excl`).

---

## Etapa 6 — Comunicação na UI ao usuário admin

Após deploy, mostrar toast no `/admin/whatsapp?tab=email-templates` com:
> “9 templates de email criados e ativos. Cada evento que dispara WhatsApp agora também envia email automaticamente.”

---

## Resumo de arquivos impactados

**Migration nova** (estrutura + seed):
- `supabase/migrations/<ts>_email_event_dispatch.sql`
  - `CREATE OR REPLACE FUNCTION queue_email_templates_for_event(...)`
  - `CREATE OR REPLACE FUNCTION trigger_queue_event_templates()` (versão atualizada chamando ambos)
  - `INSERT ... INTO email_templates` × 9 (com HTML completo)

**Edge functions**:
- `supabase/functions/process-email-queue/index.ts` — revisão pequena (variáveis + UTM no link, suppression, retry).

**UI**:
- `src/components/admin/email/EmailTemplatesTab.tsx` — adicionar dica de paridade WhatsApp e completar lista de eventos.
- `src/components/admin/email/EmailFilaTab.tsx` — coluna “Evento”.
- `src/components/admin/email/EmailLogsTab.tsx` — pequenas melhorias.

**Não mudamos**:
- Nenhum webhook (`handle-kirvano-webhook`, `cadastro-finalizar`, `receive-lead`, `handle-subscription-expiration`, `promote-lead-to-user`, `process-lead-retargeting`).
- Nenhuma função WhatsApp (`process-queue`, `queue_templates_for_event`).
- O fluxo OTP de cadastro continua intocado (Core memory).

---

## Ordem de execução

1. Migration: função `queue_email_templates_for_event` + atualização do trigger.
2. Migration de seed dos 9 templates (HTML completo, ativos).
3. Pequenos ajustes em `process-email-queue` (UTM, suppression, retry hardening) + redeploy.
4. Ajustes finos UI (3 tabs).
5. Disparar evento de teste em prod e validar.

Pronto para implementar quando você aprovar.
