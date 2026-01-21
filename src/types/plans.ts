// Tipos para o sistema de planos e permissões

export type FeatureKey =
  | 'gerador'
  | 'estatisticas'
  | 'quentes_frias'
  | 'ciclos'
  | 'comunidade_full'
  | 'guias'
  | 'notificacoes_push'
  | 'notificacoes_email'
  | 'notificacoes_sms';

export interface PlanFeatures {
  gerador?: boolean;
  estatisticas?: boolean;
  quentes_frias?: boolean;
  ciclos?: boolean;
  comunidade_full?: boolean;
  guias?: boolean;
  notificacoes_push?: boolean;
  notificacoes_email?: boolean;
  notificacoes_sms?: boolean;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  features: PlanFeatures;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ExtendedProfile {
  id: string;
  nome: string | null;
  email: string | null;
  celular: string | null;
  whatsapp: string | null;
  avatar_url: string | null;
  is_bot: boolean;
  is_blocked: boolean;
  admin_notes: string | null;
  plan_id: string | null;
  custom_features: PlanFeatures | null;
  created_at: string;
  updated_at: string;
}

// Labels amigáveis para cada feature
export const FEATURE_LABELS: Record<FeatureKey, string> = {
  gerador: 'Gerador de Jogos',
  estatisticas: 'Estatísticas Básicas',
  quentes_frias: 'Quentes e Frias',
  ciclos: 'Análise de Ciclos',
  comunidade_full: 'Comunidade Completa',
  guias: 'Acesso aos Guias',
  notificacoes_push: 'Notificações Push',
  notificacoes_email: 'Notificações Email',
  notificacoes_sms: 'Notificações SMS',
};

// Lista ordenada de features para exibição
export const FEATURE_LIST: FeatureKey[] = [
  'gerador',
  'estatisticas',
  'quentes_frias',
  'ciclos',
  'comunidade_full',
  'guias',
  'notificacoes_push',
  'notificacoes_email',
  'notificacoes_sms',
];
