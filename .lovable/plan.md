# Segmentação cirúrgica: excluir só quem comprou ESTE produto nas últimas 24h

## Problema atual

O campo `exclude_tags` do template é avaliado **sem janela de tempo**: se o lead (ou seu perfil vinculado) tem qualquer tag listada em `exclude_tags`, ele é descartado para sempre.

Isso é amplo demais — quem comprou Lotofácil há 6 meses e agora demonstra interesse em outro produto não recebe nada.

A anti-conversão por venda (`kirvano_webhook_logs`) já é restrita a 24h, mas a exclusão por **tag de perfil** não é. Esse é o gap.

## Solução proposta

Adicionar um novo campo no template — **`exclude_tags_recent`** (array de tags) — que age como filtro **temporal**:

> "Bloqueia o lead apenas se ele recebeu uma destas tags nas últimas 24h."

Assim cada template pode ter dois níveis de exclusão:

- `exclude_tags` → bloqueio permanente (quem tem o plano que cobre ESTE produto, ex: `pago_anualvip` para qualquer pré-checkout)
- `exclude_tags_recent` → bloqueio temporário (quem comprou ESTE produto específico há menos de 24h, ex: `pago_grupovip_lotofacil` no template da Lotofácil)

### Como detectar "recebeu tag nas últimas 24h"

Fonte: tabela `perfil_tag_history` (já existente — registra cada tag adicionada com timestamp). Se não existir, usaremos o `created_at` da venda em `kirvano_webhook_logs` cruzado com email/celular como proxy.

Verificarei a tabela na fase de implementação e escolherei a fonte mais confiável.

## Mudanças

### 1. Schema (migration)
- Adicionar coluna `exclude_tags_recent text[] default '{}'` em `message_templates`
- Adicionar coluna `exclude_recent_window_hours integer default 24` (configurável por template, padrão 24h)

### 2. Edge function `process-lead-retargeting`
- Ler os novos campos do template
- Após o check de `exclude_tags` (permanente), adicionar nova verificação:
  - Para cada tag em `exclude_tags_recent`, checar se o perfil/lead a recebeu na janela configurada
  - Se sim → skip com novo contador `skipped_recent_purchase`
- Adicionar métrica `skipped_recent_purchase` em `TemplateMetrics`

### 3. UI Admin (`/admin/whatsapp` → editor de templates)
- Adicionar campo "Tags de exclusão recente (24h)" no formulário de edição de template
- Adicionar input numérico "Janela de exclusão (horas)" — default 24
- Tooltip explicando: "Bloqueia o lead apenas se recebeu estas tags na janela definida. Útil para evitar enviar pré-checkout de Lotofácil para quem acabou de comprar Lotofácil, sem bloquear permanentemente."

### 4. Configuração inicial dos templates existentes
Após deploy, popular `exclude_tags_recent` nos 3 templates de pré-checkout abandono:
- Template Lotofácil → `exclude_tags_recent = ['pago_grupovip_lotofacil']`
- Template Mensal → `exclude_tags_recent = ['pago_mensal']`
- Template Anual → `exclude_tags_recent = ['pago_anual', 'pago_anualvip']`

E **reduzir** `exclude_tags` (permanente) para conter apenas planos que cobrem TUDO (ex: `pago_anualvip`), liberando cross-sell legítimo.

## Detalhes técnicos

```text
Lead chega → janela [now-24h, now-delay]
  ↓
overlap com include_tags? ────── não → ignora
  ↓ sim
exclude_tags (permanente) no perfil? ── sim → skip (skipped_paid_profile)
  ↓ não
exclude_tags_recent recebida nas últimas N horas? ── sim → skip (skipped_recent_purchase) ← NOVO
  ↓ não
venda aprovada nas últimas 24h (kirvano)? ── sim → skip (skipped_converted)
  ↓ não
dedupe 7d OK? → enfileira
```

## Resultado esperado

- Cliente que comprou Lotofácil ontem **não** recebe pré-checkout abandonado de Lotofácil hoje
- Mas **recebe** pré-checkout de Mega/Anual/outros produtos (cross-sell preservado)
- Cliente AnualVIP nunca recebe nada (continua bloqueado permanentemente)
- Cliente cancelado há 2 meses pode receber win-back novamente

Confirma esta direção? Posso prosseguir com a implementação.
