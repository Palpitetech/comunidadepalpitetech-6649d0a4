// ============================================================
// Tipos do sistema de Campanhas
// Espelha a estrutura criada na migration da Etapa 1
// ============================================================

// ------------------------------------------------------------
// ENUMs
// ------------------------------------------------------------

export type CampaignType =
  | 'transacional'  // financeiro/operacional (pix, compra, boleto)
  | 'recuperacao'   // pré-conversão / inatividade
  | 'ltv'           // pós-compra / retenção
  | 'publico';      // disparo manual para audiência retroativa

export type CampaignTriggerType =
  | 'evento'    // reage a um event_type do sistema
  | 'tag'       // reage à atribuição/presença de tag(s)
  | 'publico'   // disparo manual
  | 'ltv';      // N dias após evento de compra

export type TagMatchOperator =
  | 'any'   // tem A OU B (basta uma)
  | 'all'   // tem A E B (precisa de todas)
  | 'none'  // não tem nenhuma das include_tags
  | 'not';  // tem include_tags mas não tem exclude_tags

export type CampaignQueueStatus =
  | 'waiting'    // agendado, aguardando delay
  | 'pending'    // pronto para enviar
  | 'sending'    // sendo processado pelo worker
  | 'sent'       // enviado com sucesso
  | 'error'      // falha no envio
  | 'failed'     // falha (legado — equivalente a error)
  | 'cancelled'; // cancelado por regra durante o delay

// ------------------------------------------------------------
// Campanha principal
// ------------------------------------------------------------

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  type: CampaignType;
  trigger_type: CampaignTriggerType;

  // Referência ao plano/produto (tabela plans)
  product_id: string | null;

  // Delay antes do envio (sempre em minutos internamente)
  // UI converte: 60 = 1h, 1440 = 1d, 10080 = 7d
  delay_enabled: boolean;
  delay_minutes: number | null;

  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Referência ao template legado (remover após migração completa da UI)
  legacy_template_id: string | null;
}

// Payload para criar uma campanha
export interface CreateCampaignPayload {
  name: string;
  description?: string;
  type: CampaignType;
  trigger_type: CampaignTriggerType;
  product_id?: string;
  delay_enabled?: boolean;
  delay_minutes?: number;
  is_active?: boolean;
}

// Payload para atualizar uma campanha
export type UpdateCampaignPayload = Partial<CreateCampaignPayload>;

// ------------------------------------------------------------
// Gatilho da campanha
// 1 registro por campanha — preencher apenas os campos
// relevantes ao trigger_type da campanha pai
// ------------------------------------------------------------

export interface CampaignTrigger {
  id: string;
  campaign_id: string;

  // Usado quando trigger_type = 'evento' ou 'ltv'
  // Deve bater com os valores de EVENT_MASKS em whatsapp-event-labels.ts
  event_type: string | null;

  // Usado quando trigger_type = 'ltv'
  // Quantos dias após o evento de compra disparar
  ltv_days: number | null;

  // Usado quando trigger_type = 'tag'
  include_tags: string[] | null;
  exclude_tags: string[] | null;
  tag_operator: TagMatchOperator;

  // Usado quando trigger_type = 'publico'
  audience_event_type: string | null;
  audience_window_days: number | null;
  audience_include_tags: string[] | null;
  audience_exclude_tags: string[] | null;

  created_at: string;
}

// Payload para criar/atualizar um gatilho
export interface UpsertCampaignTriggerPayload {
  campaign_id: string;
  event_type?: string;
  ltv_days?: number;
  include_tags?: string[];
  exclude_tags?: string[];
  tag_operator?: TagMatchOperator;
  audience_event_type?: string;
  audience_window_days?: number;
  audience_include_tags?: string[];
  audience_exclude_tags?: string[];
}

// ------------------------------------------------------------
// Regras de cancelamento
// Múltiplas por campanha — OR entre elas
// Cancela itens em status 'waiting' durante o delay
// ------------------------------------------------------------

export interface CampaignCancelRule {
  id: string;
  campaign_id: string;
  label: string;

  // Cancela se este evento ocorrer durante o delay
  cancel_on_event: string | null;

  // Cancela se esta tag for adicionada durante o delay
  cancel_on_tag_added: string | null;

  // Cancela se esta tag for removida durante o delay
  cancel_on_tag_removed: string | null;

  // Atalho: cancela se qualquer compra for aprovada
  cancel_on_any_purchase: boolean;

  created_at: string;
}

// Payload para criar uma regra de cancelamento
// Pelo menos um campo de condição deve ser preenchido
export interface CreateCancelRulePayload {
  campaign_id: string;
  label?: string;
  cancel_on_event?: string;
  cancel_on_tag_added?: string;
  cancel_on_tag_removed?: string;
  cancel_on_any_purchase?: boolean;
}

// ------------------------------------------------------------
// Variantes de mensagem
// Rotação anti-bloqueio — worker seleciona a menos usada
// Máximo 10 variantes por campanha
// ------------------------------------------------------------

export interface CampaignVariant {
  id: string;
  campaign_id: string;
  content: string;
  position: number;
  is_active: boolean;
  times_used: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

// Payload para criar uma variante
export interface CreateCampaignVariantPayload {
  campaign_id: string;
  content: string;
  position: number;
  is_active?: boolean;
}

// Payload para atualizar uma variante
export type UpdateCampaignVariantPayload = Partial<
  Pick<CreateCampaignVariantPayload, 'content' | 'position' | 'is_active'>
>;

// ------------------------------------------------------------
// Campanha completa (com joins)
// Usado nas listagens e no editor da UI
// ------------------------------------------------------------

export interface CampaignFull extends Campaign {
  trigger: CampaignTrigger | null;
  cancel_rules: CampaignCancelRule[];
  variants: CampaignVariant[];
}

// ------------------------------------------------------------
// Helpers de UI
// ------------------------------------------------------------

// Rótulos para exibição dos tipos na interface
export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  transacional: 'Transacional',
  recuperacao: 'Recuperação',
  ltv: 'LTV',
  publico: 'Público',
};

export const CAMPAIGN_TRIGGER_TYPE_LABELS: Record<CampaignTriggerType, string> = {
  evento: 'Evento',
  tag: 'Tag',
  publico: 'Público',
  ltv: 'LTV',
};

export const TAG_OPERATOR_LABELS: Record<TagMatchOperator, string> = {
  any: 'Tem A ou B (qualquer uma)',
  all: 'Tem A e B (todas)',
  none: 'Não tem nenhuma',
  not: 'Tem A mas não tem B',
};

// Helper: converte delay_minutes para texto legível
export function formatDelayMinutes(minutes: number | null): string {
  if (!minutes) return 'Sem delay';
  if (minutes < 60) return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  if (minutes < 1440) {
    const h = Math.round(minutes / 60);
    return `${h} hora${h !== 1 ? 's' : ''}`;
  }
  const d = Math.round(minutes / 1440);
  return `${d} dia${d !== 1 ? 's' : ''}`;
}

// Helper: converte valor de UI (número + unidade) para minutes
export function toDelayMinutes(value: number, unit: 'minutos' | 'horas' | 'dias'): number {
  if (unit === 'minutos') return value;
  if (unit === 'horas') return value * 60;
  return value * 1440;
}
