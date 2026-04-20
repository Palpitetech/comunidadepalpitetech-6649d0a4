

## Diagnóstico — Grupo VIP Lotofácil no fluxo de mensagens

### Problemas críticos encontrados

#### 🔴 1. Kirvano não tem oferta mapeada para Grupo VIP Lotofácil
A tabela `kirvano_offer_plan_map` tem **3 mapeamentos** (mensal, semestral, anual) mas **nenhum** para Grupo VIP. Quando alguém comprar pelo checkout `pay.kirvano.com/19990908-ca9b-4df1-a0df-e2690927490b`, o webhook vai retornar `offer_mapping_not_found` e **a compra não será ativada nem disparará evento**.

#### 🔴 2. Evento errado disparado pela Kirvano
O webhook Kirvano insere evento com `event_type = 'compra_aprovada'` (linha 843), mas o template "Compra aprovada" escuta `event_trigger = 'sale_confirmed'`. **Resultado: o template nunca dispara para nenhum plano.** Bug pré-existente, não específico do Grupo VIP.

#### 🟡 3. Trigger usa nomenclatura antiga de prioridade
A função `trigger_queue_event_templates` mapeia `'subscription_expired' → priority 8`, mas o vocabulário oficial agora é `'assinatura_expirada'`. Inconsistência que precisa alinhar.

#### 🟡 4. Variável `{{produto}}` pode vir vazia
O trigger monta variáveis `nome`, `telefone`, `email` mas **não inclui `produto`** (nome do plano). O template "Compra aprovada" usa `{{produto}}` — vai sair literal "{{produto}}" na mensagem.

#### 🟢 5. Tags do Grupo VIP — OK
A função `sync_perfil_tags()` já mapeia corretamente:
- Ativa → `pago_grupovip_lotofacil`
- Cancelada com validade → `grupovip_cancelado_ativo`
- Cancelada vencida → `grupovip_cancelado_inativo`

Tags estão prontas para segmentação.

---

### Mudanças propostas

#### A. Cadastrar oferta Kirvano para Grupo VIP (insert tool)

```sql
INSERT INTO kirvano_offer_plan_map (offer_id, plan_id, days_valid, is_active)
VALUES ('19990908-ca9b-4df1-a0df-e2690927490b', 'a23694fd-87f4-4edd-a6eb-8e51b3c90430', 30, true);
```

Identifiquei o `offer_id` extraindo do checkout link já cadastrado no plano. Validade 30 dias (mensal).

#### B. Corrigir nome do evento na Kirvano webhook

`supabase/functions/handle-kirvano-webhook/index.ts` linha 843:
```ts
// ANTES
await insertEvent(targetPerfilId, "compra_aprovada", {...});
// DEPOIS
await insertEvent(targetPerfilId, "sale_confirmed", {...});
```

Alinha com o vocabulário oficial e faz o template "Compra aprovada" finalmente disparar.

#### C. Atualizar trigger para passar `produto` + alinhar prioridades

Migração SQL atualizando `trigger_queue_event_templates`:
- Buscar `plans.name` via `plan_id` do perfil
- Adicionar `produto` e `plano_nome` no objeto `v_variables`
- Atualizar mapa de prioridades para usar `assinatura_expirada` (e manter `subscription_expired` como fallback temporário)
- Adicionar `acesso_cortado`, `trial_iniciado` no mapa de prioridades

#### D. Enriquecer template "Compra aprovada" com mensagem específica por plano

Em vez de mensagem genérica, criar **2 variantes**:

**Variante 1 — Compra aprovada (Acesso ao App)** — para Mensal/Anual/AnualVIP
- Filtro: `include_tags: [pago_mensal, pago_anual, pago_anualvip]`, modo `any`
- Conteúdo:
```
🎉 Pagamento confirmado, {{nome}}!

Seu plano *{{produto}}* já está ativo. ✅

🔑 *Seus dados de acesso ao app:*
📧 Email: {{email}}
🔒 Senha: use *123456* no primeiro acesso e altere em seguida
🔗 Login: https://www.palpitetech.com.br/login

🎯 *O que você desbloqueou:*
• Geradores ilimitados (Lotofácil, Mega, Quina, Dupla Sena)
• Estatísticas avançadas e tendências
• Bolões exclusivos
• Chat IA com especialistas
• Mentoria estratégica

Bons palpites! Qualquer dúvida, é só chamar. 💬
```

**Variante 2 — Compra aprovada (Grupo VIP Lotofácil)** — só para Grupo VIP
- Filtro: `include_tags: [pago_grupovip_lotofacil]`, modo `any`
- Conteúdo:
```
🎉 Pagamento confirmado, {{nome}}!

Bem-vindo(a) ao *Grupo VIP Lotofácil*! ✅

📱 *Como funciona:*
Você vai receber palpites prontos da Lotofácil direto neste WhatsApp, em grupo exclusivo, com análises diárias da nossa equipe.

🔗 *Link de entrada no grupo VIP:*
{{link_grupo_vip}}

⚠️ *Importante:*
Este produto é exclusivamente WhatsApp — não inclui acesso às ferramentas do app. Se quiser usar geradores, estatísticas e bolões, conheça nossos planos completos em https://www.palpitetech.com.br/planos

Bons palpites! 🍀
```

A variável `{{link_grupo_vip}}` virá fixa do template hoje (link do grupo configurado no admin). Posso passar via `metadata` do evento se preferir dinâmico depois.

**Desativar** o template "Compra aprovada" original (que era genérico).

#### E. Atualizar `trigger_queue_event_templates` para incluir `link_grupo_vip` nas variáveis

Buscar `group_blast_configs.vip_group_link` (primeiro ativo) e injetar como variável padrão. Assim a variante 2 funciona sem hard-code.

---

### Tabela final de templates do evento `sale_confirmed`

| Template | Filtro de tags | Público |
|---|---|---|
| Compra aprovada (App) | `pago_mensal` ∪ `pago_anual` ∪ `pago_anualvip` | Assinantes plataforma |
| Compra aprovada (Grupo VIP) | `pago_grupovip_lotofacil` | Compradores grupo WhatsApp |

Cada comprador recebe **apenas a mensagem certa para o produto que comprou** — o motor de tags + filtros já garante isso.

---

### Checklist de validação pós-deploy

1. ✅ Insert no `kirvano_offer_plan_map` para Grupo VIP
2. ✅ Edge function `handle-kirvano-webhook` corrigida (`sale_confirmed`)
3. ✅ Trigger SQL atualizado (variáveis `produto`, `link_grupo_vip`)
4. ✅ 2 variantes de template criadas + original desativado
5. 🧪 **Teste end-to-end:** simular webhook Kirvano para cada plano e verificar fila

---

### Arquivos editados

| Arquivo | Mudança |
|---|---|
| Insert tool | Cadastra oferta Kirvano para Grupo VIP + cria 2 templates novos + desativa antigo |
| `supabase/functions/handle-kirvano-webhook/index.ts` | Renomeia evento `compra_aprovada` → `sale_confirmed` |
| Nova migração SQL | Atualiza `trigger_queue_event_templates` para incluir `produto`, `plano_nome`, `link_grupo_vip` e corrigir mapa de prioridades |

### Fora de escopo
- Sem mudança no `should_send_template` (lógica está correta)
- Sem mudança em `sync_perfil_tags` (já cobre Grupo VIP)
- Sem mudança no admin UI de templates (criação/edição via SQL pra ser preciso)

