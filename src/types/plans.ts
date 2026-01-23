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
  | 'notificacoes_sms'
  | 'chat_boloes'
  | 'chat_duvidas_ferramentas'
  | 'chat_duvidas_comunidade'
  | 'chat_acesso_ferramentas'
  | 'chat_estatisticas';

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
  chat_boloes?: boolean;
  chat_duvidas_ferramentas?: boolean;
  chat_duvidas_comunidade?: boolean;
  chat_acesso_ferramentas?: boolean;
  chat_estatisticas?: boolean;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string | null;
  checkout_link: string | null;
  features: PlanFeatures;
  chat_estatisticas_max_msgs_per_day?: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type StatusAssinatura = 'ativa' | 'cancelada' | 'inadimplente' | 'inativa';

export interface ExtendedProfile {
  id: string;
  nome: string | null;
  email: string | null;
  celular: string | null;
  whatsapp: string | null;
  avatar_url: string | null;
  email_verificado?: boolean;
  celular_verificado?: boolean;
  is_bot: boolean;
  is_blocked: boolean;
  admin_notes: string | null;
  plan_id: string | null;
  custom_features: PlanFeatures | null;
  created_at: string;
  updated_at: string;
  
  // Campos de assinatura
  status_assinatura: string | null;
  validade_assinatura: string | null;
  cpf: string | null;
}

// Labels amigáveis para cada feature
export const FEATURE_LABELS: Record<FeatureKey, string> = {
  gerador: 'Gerador de Jogos',
  estatisticas: 'Estatísticas Avançadas',
  quentes_frias: 'Quentes e Frias',
  ciclos: 'Análise de Ciclos',
  comunidade_full: 'Mesa Redonda (Comunidade)',
  guias: 'Mentoria IA (Guias)',
  notificacoes_push: 'Notificações Push',
  notificacoes_email: 'Notificações Email',
  notificacoes_sms: 'Notificações WhatsApp',
  chat_boloes: 'Chat: Conhecer bolões',
  chat_duvidas_ferramentas: 'Chat: Dúvidas das ferramentas',
  chat_duvidas_comunidade: 'Chat: Dúvidas da comunidade',
  chat_acesso_ferramentas: 'Chat: Acesso às ferramentas',
  chat_estatisticas: 'Chat: Conversar sobre estatísticas',
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
  'chat_boloes',
  'chat_duvidas_ferramentas',
  'chat_duvidas_comunidade',
  'chat_acesso_ferramentas',
  'chat_estatisticas',
];
