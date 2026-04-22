/**
 * Mapeamento canônico entre event_type cru e label legível.
 * Centralizado para reuso em TemplatesTab, FilaTab, LogsTab e disparos manuais.
 */
export const EVENT_MASKS: Record<string, string> = {
  novo_cadastro: "Novo Cadastro",
  compra_aprovada: "Compra Aprovada",
  pix_gerado: "PIX Gerado",
  pix_expirado: "PIX Expirado",
  boleto_gerado: "Boleto Gerado",
  boleto_expirado: "Boleto Expirado",
  assinatura_cancelada: "Assinatura Cancelada",
  assinatura_inadimplente: "Inadimplente",
  assinatura_expirada: "Assinatura Expirada",
  acesso_cortado: "Acesso Cortado",
  trial_iniciado: "Trial Iniciado",
  checkout_abandonado: "Checkout Abandonado",
  carrinho_abandonado: "Carrinho Abandonado",
  SALE_APPROVED: "Venda Aprovada",
  SALE_REFUSED: "Venda Recusada",
  SALE_CHARGEBACK: "Chargeback",
  SALE_REFUNDED: "Reembolso",
  BANK_SLIP_GENERATED: "Boleto Gerado",
  BANK_SLIP_EXPIRED: "Boleto Expirado",
  PIX_GENERATED: "PIX Gerado",
  PIX_EXPIRED: "PIX Expirado",
  SUBSCRIPTION_CANCELED: "Assinatura Cancelada",
  SUBSCRIPTION_OVERDUE: "Inadimplente",
  SUBSCRIPTION_RENEWED: "Assinatura Renovada",
  SUBSCRIPTION_REACTIVATED: "Assinatura Reativada",
  SUBSCRIPTION_TRIAL_STARTED: "Teste Iniciado",
  SUBSCRIPTION_TRIAL_ENDED: "Teste Encerrado",
  CHECKOUT_ABANDONED: "Checkout Abandonado",
  ABANDONED_CART: "Carrinho Abandonado",
  SUBSCRIPTION_EXPIRED: "Assinatura Expirada",
  manual: "Manual",
  lead_created: "Lead Cadastrado",
  sale_confirmed: "Venda Confirmada",
  lead_pre_checkout_abandono: "Lead — Pré-checkout abandonado",
};

export function getEventLabel(eventType: string): string {
  return EVENT_MASKS[eventType] || eventType;
}
