
## Objetivo

Refatorar a tela `/admin/vendas` para mostrar uma linha por **venda** (não por evento), com colunas mais úteis, e adicionar no painel lateral a ação "Enviar mensagem do evento" para disparar manualmente o template configurado para aquele evento.

---

## Etapa 1 — Refatorar a tabela de Vendas (desktop + mobile)

### 1.1 Novas colunas da tabela (desktop)

Sequência exata (substitui as atuais):

| Coluna | Origem |
|---|---|
| Nome | `raw_payload.customer.name` do log mais recente da venda |
| Email | `email` do log (já mascarado pela view) |
| Telefone | `phone` do log (já mascarado) |
| Valor | `raw_payload.total_price` |
| Status | `latest.event` mapeado via `EVENT_LABELS` (Aprovada / PIX Gerado / Recusada / etc.) |

**Removidas:** Resultado, Data, Eventos, PIX (botão de copiar), ícone de método de pagamento na 1ª coluna (vira parte do Status ou é descartado — ver 1.3).

### 1.2 Status agregado (não cria linha nova)

O agrupamento por `sale_id || checkout_id` já existe (`sales` em `useMemo`). O campo `latest.event` já reflete o evento mais recente de cada venda — ou seja, **o status já é evolutivo** (PIX_GENERATED → SALE_APPROVED sobrescreve o badge mostrado). Apenas precisamos garantir que a UI exiba uma linha por venda usando esse `latest.event` como Status.

### 1.3 Lista mobile (cards)

- Remover o botão de copiar PIX inline.
- Manter: Nome, badge de Status (`latest.event`), Valor à direita.
- Mantém o tap para abrir o painel lateral.

### 1.4 Limpeza

- Remover `pixCodeFromEvents`, `copyPixCode`, `RESULT_LABELS`, `getResultInfo` da listagem (mantidos apenas dentro do `SaleDetail` se ainda fizerem sentido na timeline — o bloco `PixCodeBlock` continua disponível dentro do detalhe).
- Remover imports não usados (`Copy` do header da linha, etc.).

---

## Etapa 2 — Painel lateral: enviar mensagem do evento

### 2.1 Botão por evento na Linha do Tempo

Dentro de `SaleDetail`, em cada item da timeline (`events.map`), adicionar um botão **"Enviar mensagem deste evento"** ao lado do timestamp/badge.

- Visível apenas se houver telefone na venda (`latest.phone || customer.phone_number`).
- Ao clicar:
  1. Mapear o `event` bruto da Kirvano (ex: `PIX_GENERATED`) para o `event_trigger` interno (ex: `pix_gerado`) usando o mesmo `KIRVANO_EVENT_MAP` do webhook (será replicado no front como constante).
  2. Verificar se existem templates ativos com aquele `event_trigger` em `message_templates`. Se não houver, mostrar toast: *"Nenhum template ativo para este evento."* e abortar.
  3. Confirmar com `AlertDialog`: *"Disparar template do evento `{label}` para `{nome/telefone}`?"*
  4. Chamar `supabase.rpc('queue_templates_for_event', { p_event_trigger, p_phone, p_name, p_user_id, p_variables, p_priority: 1 })`.
  5. Toast com a contagem retornada (`N mensagens enfileiradas`).

### 2.2 Variáveis enviadas

Construir `p_variables` a partir do `raw_payload` do evento clicado, contemplando todos os tokens já usados nos templates (PIX inclusive):

```ts
{
  nome: customer.name,
  telefone: phone,
  email,
  produto: products?.[0]?.name,
  plano_nome: products?.[0]?.name,
  total_price: payload.total_price,
  pix_codigo: payment.qrcode,           // se PIX
  link_novo_pix: planMap[offer_id]?.checkoutLink,  // resolvido via kirvano_offer_plan_map
  sale_id, checkout_id,
}
```

`p_user_id`: tentar resolver via `perfis.email = latest.email` (consulta rápida antes da RPC) — se não houver, passa `null` (a função aceita).

### 2.3 Estado visual

- Loading no botão clicado (spinner).
- Desabilitar botão após disparo bem-sucedido por 5s para evitar duplo clique.

---

## Detalhes técnicos

**Arquivos editados:**
- `src/pages/admin/AdminVendas.tsx` — toda a refatoração de tabela, lista mobile e adição do botão de disparo na timeline + helper `dispatchEventTemplate(event, sale)`.

**Sem alterações:**
- Banco de dados: `queue_templates_for_event` já existe e aceita `p_variables jsonb`.
- Webhook: nenhum ajuste necessário.
- `useDisparoManual`: não é reutilizado aqui (esse hook é para massa); o disparo individual chama a RPC diretamente.

**Mapa de eventos (constante local em AdminVendas.tsx):**
```ts
const KIRVANO_TO_TRIGGER: Record<string, string> = {
  SALE_APPROVED: "compra_aprovada",
  SALE_REFUSED: "compra_recusada",
  SALE_REFUNDED: "compra_reembolsada",
  SALE_CHARGEBACK: "compra_chargeback",
  PIX_GENERATED: "pix_gerado",
  PIX_EXPIRED: "pix_expirado",
  BANK_SLIP_GENERATED: "boleto_gerado",
  BANK_SLIP_EXPIRED: "boleto_expirado",
  ABANDONED_CART: "carrinho_abandonado",
  CHECKOUT_ABANDONED: "checkout_abandonado",
  SUBSCRIPTION_RENEWED: "assinatura_renovada",
  SUBSCRIPTION_CANCELED: "assinatura_cancelada",
  SUBSCRIPTION_EXPIRED: "assinatura_expirada",
  SUBSCRIPTION_OVERDUE: "assinatura_inadimplente",
};
```

---

## Fora do escopo

- Não alterar `AdminEventos` nem `handle-kirvano-webhook`.
- Não criar novos templates; o disparo usa o que já está em `message_templates` para aquele `event_trigger`.
- Não mexer em `should_send_template` (dedupe por janela continua valendo — se o usuário já recebeu este template recentemente, será silenciosamente pulado pela função; o toast informará `0 enfileiradas`).
