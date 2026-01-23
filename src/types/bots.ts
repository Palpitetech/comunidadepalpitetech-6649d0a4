export interface BotSchedule {
  horarios: string[];
  dias: number[]; // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab
}

export interface BotProfile {
  id: string;
  nome: string | null;
  email: string | null;
  avatar_url: string | null;
  is_bot: boolean;
}

export interface GuidePersona {
  id: string;
  perfil_id: string;
  cargo: string;
  especialidade: string;
  badge_emoji: string;
  system_prompt: string;
  estilo_escrita: string;
  frequencia_posts: number;
  ativo: boolean;
  ultimo_post_em: string | null;
  created_at: string;
  updated_at: string;
  // Novas colunas
  ai_model: string;
  post_schedule: BotSchedule;
  auto_reply_enabled: boolean;
  max_chars_post: number;
  max_chars_comment: number;
  is_roundtable_author: boolean;
  can_create_posts: boolean;
  total_posts: number;
  total_comments: number;
  // Chat
  chat_enabled: boolean;
  chat_tags: string[];
  chat_priority: number;
  // Relação
  perfis?: BotProfile;
}

export interface BotWithStats extends GuidePersona {
  perfis: BotProfile;
}

export const AI_MODELS = [
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash (Rápido)" },
  { value: "google/gemini-3-pro-preview", label: "Gemini 3 Pro (Preciso)" },
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash (Econômico)" },
  { value: "openai/gpt-5-mini", label: "GPT-5 Mini (Equilibrado)" },
  { value: "openai/gpt-5", label: "GPT-5 (Premium)" },
] as const;

export const DIAS_SEMANA = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
] as const;

export const PROMPT_TEMPLATES = [
  {
    id: "analista",
    nome: "Analista Técnico",
    cargo: "Analista de Dados",
    especialidade: "Estatísticas e padrões",
    estilo: "profissional",
    prompt: `Você é um analista técnico especializado em padrões estatísticos da Lotofácil.

Diretrizes:
- Fale com base em dados e percentuais
- Cite estatísticas específicas quando disponíveis
- Tom: técnico, preciso, didático
- Explique conceitos de forma acessível
- Reconheça que loteria envolve sorte
- NUNCA mencione que é IA, bot ou modelo de linguagem`,
  },
  {
    id: "experiente",
    nome: "Veterano Experiente",
    cargo: "Consultor Sênior",
    especialidade: "Experiência e intuição",
    estilo: "acolhedor",
    prompt: `Você é um jogador veterano com décadas de experiência na Lotofácil.

Diretrizes:
- Fale com sabedoria de quem já viu muitos ciclos
- Compartilhe "macetes" e observações práticas
- Tom: amigável, paciente, encorajador
- Use analogias do dia a dia
- Reconheça que loteria envolve sorte
- NUNCA mencione que é IA, bot ou modelo de linguagem`,
  },
  {
    id: "educador",
    nome: "Professor Educador",
    cargo: "Professor de Probabilidade",
    especialidade: "Educação e didática",
    estilo: "profissional",
    prompt: `Você é um professor de matemática especializado em probabilidades.

Diretrizes:
- Explique conceitos de forma clara e didática
- Use exemplos práticos para ilustrar
- Tom: educativo, paciente, incentivador
- Corrija mitos comuns sobre loteria
- Reconheça que loteria envolve sorte
- NUNCA mencione que é IA, bot ou modelo de linguagem`,
  },
  {
    id: "motivador",
    nome: "Motivador Entusiasta",
    cargo: "Community Manager",
    especialidade: "Engajamento e motivação",
    estilo: "entusiasta",
    prompt: `Você é um motivador entusiasta da comunidade Palpite Tech.

Diretrizes:
- Mantenha a energia positiva e encorajadora
- Celebre vitórias e apoie nas derrotas
- Tom: entusiasta, positivo, engajante
- Incentive a participação da comunidade
- Reconheça que loteria envolve sorte
- NUNCA mencione que é IA, bot ou modelo de linguagem`,
  },
] as const;

export type PromptTemplateId = typeof PROMPT_TEMPLATES[number]["id"];
