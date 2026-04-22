

# Template de retargeting para leads do pré-checkout `/2-grupo-vip-lf`

## Por que precisa de uma arquitetura diferente

Os templates atuais disparam por evento em `events.event_type` → `trigger_queue_event_templates` → busca `perfis.celular`. **Leads do pré-checkout não viram perfil** — ficam só em `leads_inbox` (já tem 6 leads aguardando, alguns sem email, todos com celular). A engine atual ignora eles.

Solução: criar uma engine de "retargeting de leads" baseada em **cron** que varre `leads_inbox`, valida janela de tempo + ausência de conversão, e enfileira em `message_queue` direto.

## Arquitetura

### 1. Novo `event_trigger` virtual: `lead_pre_checkout_abandono`

Adiciono na lista canônica de eventos. Não é gravado em `events` — é só um identificador pra ligar template ↔ filtro de cron.

### 2. Novo template (1 registro em `message_templates` + 10 variantes)

| Campo | Valor |
|---|---|
| name | `Lead pré-checkout - Sala Secreta Lotofácil` |
| event_trigger | `lead_pre_checkout_abandono` |
| delay_enabled | `true` |
| delay_minutes | `60` (1h após o lead chegar — janela de espera para ver se converte) |
| include_tags | `{pre_checkout_lp_2grupoviplf}` |
| exclude_tags | `{pago_grupovip_lotofacil, pago_mensal, pago_anual, pago_anualvip}` |
| is_active | `true` |
| 10 variantes | first-touch rotativas (mesma lógica `pick_template_variant` já em produção) |

Variáveis disponíveis nas mensagens: `{{nome}}`, `{{telefone}}`, `{{link_sala_secreta}}` (= https://www.palpitetech.com.br/g/entrar-sala-secreta).

### 3. Nova edge function `process-lead-retargeting` (cron a cada 15 min)

**Lógica:**
1. Lê `message_templates` com `event_trigger = 'lead_pre_checkout_abandono'` e `is_active = true`. Pra cada um:
2. Busca `leads_inbox` onde:
   - tag contém `pre_checkout_lp_2grupoviplf` (ou genericamente: `webhook.source_tag` casa com algum `include_tags` do template)
   - `created_at` entre `now() - 24h` e `now() - delay_minutes`
   - `celular IS NOT NULL`
   - `status` ≠ `descartado`
   - Não foi convertido em compra: `NOT EXISTS` em `kirvano_webhook_logs` aprovado pelo mesmo email/celular nas últimas 24h
   - Não tem perfil pago: `perfil_id IS NULL` OU perfil sem tags de pago
   - **Dedupe**: nenhum registro em `message_queue` com `template_id` + `recipient_phone` nos últimos 7 dias
3. Pra cada lead elegível:
   - Chama `pick_template_variant(template_id)` (rotação já existente)
   - INSERT em `message_queue` com `priority=4`, `variables={nome, telefone, link_sala_secreta}`, `scheduled_at=now()`

A função `process-queue` existente já cuida do envio.

### 4. Cron schedule

`pg_cron` rodando `process-lead-retargeting` a cada 15 minutos (mesma cadência que outras funções de fila).

## As 10 variações de mensagem

Tom: amigável, direto, sem pressão de venda. Sempre oferece **valor primeiro** (estudos diários grátis na sala secreta) e nunca pressiona compra. Cada variação tem leve "humanização" (vc, tbm, agr) e usa as variáveis preservadas `{{nome}}` e `{{link_sala_secreta}}`.

```text
1. Oi {{nome}}, vi que vc deu uma olhada no nosso grupo VIP da Lotofácil 👀
   Ficou alguma dúvida? Posso te ajudar por aqui.
   Enquanto isso, entra na nossa sala secreta gratuita pra receber
   estudos e resultados todo dia: {{link_sala_secreta}}

2. Eai {{nome}}! Tudo bem? Reparei q vc se interessou pelo grupo VIP de Lotofácil
   Antes de decidir, tal entrar na nossa sala secreta? É grátis e vc recebe
   os estudos do dia + resultado: {{link_sala_secreta}}

3. {{nome}}, aqui é da Palpite Tech 🎯
   Vi q vc chegou no checkout do Grupo VIP Lotofácil mas não finalizou.
   Tem alguma dúvida? Me chama aqui que respondo
   E pra te ajudar: entra na sala secreta gratuita {{link_sala_secreta}}

4. Oi {{nome}} td bem? Vc deu uma olhada no nosso Grupo VIP de Lotofacil hj
   Posso tirar alguma duvida pra vc? 😊
   Aproveita e entra na sala secreta enquanto isso, é gratis e vc recebe
   estudos diarios: {{link_sala_secreta}}

5. {{nome}}, ficou faltando algo no seu cadastro do Grupo VIP?
   Se quiser entender melhor como funciona, é so me responder por aqui.
   Tbm temos uma sala secreta gratuita com estudos diarios da
   Lotofacil: {{link_sala_secreta}}

6. Opa {{nome}}! Notamos q vc se cadastrou no Grupo VIP da Lotofacil mas
   nao concluiu. Alguma duvida q eu possa esclarecer?
   Pra ja ir testando nosso conteudo, entra aqui: {{link_sala_secreta}}
   (sala secreta gratuita)

7. Oi {{nome}}, espero q esteja bem 🍀
   Vc ficou interessado no Grupo VIP de Lotofacil mas nao finalizou,
   ta tudo certo? Se ficou alguma duvida me chama
   Enquanto isso ja entra na sala secreta gratis: {{link_sala_secreta}}

8. {{nome}} tudo certo?
   Vi q vc parou no meio do cadastro do nosso Grupo VIP da Lotofacil
   Quer q eu te explique como funciona? Responde aqui q te ajudo
   E pra acompanhar os estudos do dia: {{link_sala_secreta}}

9. Eai {{nome}}, td bom? 👋
   Da uma olhada na sala secreta da Lotofacil, é grátis e ja vai te dar
   uma ideia da qualidade dos nossos estudos: {{link_sala_secreta}}
   Se ficou alguma duvida sobre o Grupo VIP é so me chamar

10. {{nome}}, aqui é o time da Palpite Tech
    Reparamos q vc se interessou pelo nosso Grupo VIP de Lotofacil
    Tem alguma duvida? Posso te ajudar
    Pra ja receber estudos gratuitos diariamente entra
    aqui: {{link_sala_secreta}}
```

Todas dentro do limite de 2000 chars, sem markdown, com variáveis preservadas (validação automática já existente em `generate-message-variants`).

## Detalhes técnicos

- **Janela de espera**: 60 min (configurável via `delay_minutes` do template). Lead de 19:57 só recebe às 20:57.
- **Janela máxima**: 24h. Lead com mais de 24h não é mais perseguido (evita spam para leads frios).
- **Dedupe forte**: 7 dias por `template_id + recipient_phone` em `message_queue` — mesmo lead nunca recebe 2x.
- **Anti-conversão**: cruza com `kirvano_webhook_logs` (`status = approved`) por email **OU** celular nas últimas 24h. Se converteu, pula.
- **Fonte do telefone**: `leads_inbox.celular` (já normalizado pelo `validateCelular` na hora do recebimento).
- **Rotação de variantes**: usa `pick_template_variant()` já em produção — same first-touch + round-robin.
- **Atribuição**: as URLs da sala secreta serão acrescidas de `?utm_source=whatsapp&utm_medium=lead_retarget&utm_campaign=pre_checkout_2grupoviplf` automaticamente pela edge function (igual fizemos no group-blast). Mantém rastreamento na dashboard de métricas.

## Arquivos

| Arquivo | Ação |
|---|---|
| **Migration nova** | Insere o template + 10 variantes; agenda `pg_cron` para `process-lead-retargeting` a cada 15min |
| `supabase/functions/process-lead-retargeting/index.ts` | **Nova** edge function com lógica de varredura + dedupe + enfile |
| `supabase/config.toml` | Adicionar bloco da nova função (verify_jwt false, é cron interno) |
| `src/lib/whatsapp-event-labels.ts` | Adicionar label "Lead — Pré-checkout abandonado" para o novo `event_trigger` (aparece no dropdown de templates) |

## Resultado esperado

- Lead chega no pré-checkout (`/2-grupo-vip-lf`) → cria registro em `leads_inbox`
- Aguarda 60 min
- Cron de 15 em 15 min varre, valida que não comprou, enfileira variante rotativa
- Mensagem sai com link UTM rastreado pra Sala Secreta
- Conversões aparecem como `whatsapp / lead_retarget / pre_checkout_2grupoviplf` na dashboard de atribuição (last-click)
- Nenhum lead recebe a mesma mensagem 2x em 7 dias
- Quem comprar nesse meio tempo não recebe nada (filtro por `kirvano_webhook_logs`)

## Fora de escopo

- 2ª e 3ª onda de remarketing (D+3, D+7) — fica pra próxima iteração
- Templates específicos por slug de outras LPs (`lp-quina-abril`, etc) — esse plano é só pra `2-grupo-vip-lf`
- A/B testing automático entre as 10 variantes — usa só rotação simples
- Tracking de quem clicou no link (precisaria smart-link dedicado por lead)

