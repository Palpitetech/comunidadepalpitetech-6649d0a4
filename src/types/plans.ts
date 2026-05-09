// Tipos para o sistema de planos e permissões

export type FeatureKey =
  | 'gerador'
  | 'fechamento'
  | 'desdobramento'
  | 'estatisticas'
  | 'quentes_frias'
  | 'ciclos'
  | 'tendencias'
  | 'linhas_colunas'
  | 'tabela_movimentacao'
  | 'frequencia_dezenas'
  | 'dezenas_por_posicao'
  | 'analise_do_dia'
  | 'comunidade_full'
  | 'guias'
  | 'notificacoes_push'
  | 'notificacoes_email'
  | 'notificacoes_sms'
  | 'chat_boloes'
  | 'chat_duvidas_ferramentas'
  | 'chat_duvidas_comunidade'
  | 'chat_acesso_ferramentas'
  | 'chat_estatisticas'
  | 'palpites_salvos'
  | 'mega_30_anos';

export interface PlanFeatures {
  gerador?: boolean;
  fechamento?: boolean;
  desdobramento?: boolean;
  estatisticas?: boolean;
  quentes_frias?: boolean;
  ciclos?: boolean;
  tendencias?: boolean;
  linhas_colunas?: boolean;
  tabela_movimentacao?: boolean;
  frequencia_dezenas?: boolean;
  dezenas_por_posicao?: boolean;
  analise_do_dia?: boolean;
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
  palpites_salvos?: boolean;
  mega_30_anos?: boolean;
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
  gerador_max_per_day?: number;
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
  trial_used?: boolean;
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
  tags: string[];
  utm_source?: string | null;
}

// Labels amigáveis para cada feature
export const FEATURE_LABELS: Record<FeatureKey, string> = {
  gerador: 'Gerador de Jogos',
  fechamento: 'Fechamento',
  desdobramento: 'Desdobramento',
  estatisticas: 'Estatísticas Avançadas',
  quentes_frias: 'Quentes e Frias',
  ciclos: 'Análise de Ciclos',
  tendencias: 'Tendências',
  linhas_colunas: 'Linhas e Colunas',
  tabela_movimentacao: 'Tabela de Movimentação',
  frequencia_dezenas: 'Frequência de Dezenas',
  dezenas_por_posicao: 'Dezenas por Posição',
  analise_do_dia: 'Análise do Dia',
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
  palpites_salvos: 'Meus Palpites (Salvar)',
  mega_30_anos: 'Mega 30 Anos (Estudos especiais)',
};

// Categorias de features
export interface FeatureCategory {
  label: string;
  emoji: string;
  features: FeatureKey[];
}

export const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    label: 'Ferramentas',
    emoji: '🛠️',
    features: ['gerador', 'fechamento', 'desdobramento', 'palpites_salvos', 'mega_30_anos'],
  },
  {
    label: 'Estatísticas',
    emoji: '📊',
    features: [
      'estatisticas',
      'quentes_frias',
      'ciclos',
      'tendencias',
      'linhas_colunas',
      'tabela_movimentacao',
      'frequencia_dezenas',
      'dezenas_por_posicao',
      'analise_do_dia',
    ],
  },
  {
    label: 'Comunidade',
    emoji: '👥',
    features: ['comunidade_full', 'guias'],
  },
  {
    label: 'Notificações',
    emoji: '🔔',
    features: ['notificacoes_push', 'notificacoes_email', 'notificacoes_sms'],
  },
  {
    label: 'Chat IA',
    emoji: '🤖',
    features: [
      'chat_boloes',
      'chat_duvidas_ferramentas',
      'chat_duvidas_comunidade',
      'chat_acesso_ferramentas',
      'chat_estatisticas',
    ],
  },
];

// Lista ordenada de todas as features (flat)
export const FEATURE_LIST: FeatureKey[] = FEATURE_CATEGORIES.flatMap((c) => c.features);
