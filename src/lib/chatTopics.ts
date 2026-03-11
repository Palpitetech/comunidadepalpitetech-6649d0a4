import type { FeatureKey } from "@/types/plans";

export type ChatTopicId =
  | "estrategias"
  | "estrategias_megasena"
  | "estrategias_duplasena"
  | "conhecer_planos";

export interface ChatTopic {
  id: ChatTopicId;
  title: string;
  description: string;
  feature: FeatureKey;
  botTag: string;
  starterUserMessage: string;
  /** Emoji/color indicator for the lottery */
  emoji?: string;
}

export const CHAT_TOPICS: ChatTopic[] = [
  {
    id: "estrategias",
    title: "Lotofácil",
    description: "Análises, ciclos e estratégias para a Lotofácil.",
    feature: "chat_estatisticas",
    botTag: "chat_duvidas_ferramentas",
    starterUserMessage: "Quero analisar a Lotofácil com dados reais.",
    emoji: "🟢",
  },
  {
    id: "estrategias_megasena",
    title: "Mega-Sena",
    description: "Análises, padrões e estratégias para a Mega-Sena.",
    feature: "chat_estatisticas",
    botTag: "chat_megasena",
    starterUserMessage: "Quero analisar a Mega-Sena com dados reais.",
    emoji: "🔵",
  },
  {
    id: "estrategias_duplasena",
    title: "Dupla Sena",
    description: "Análises e estratégias exclusivas para a Dupla Sena.",
    feature: "chat_estatisticas",
    botTag: "chat_duplasena",
    starterUserMessage: "Quero analisar a Dupla Sena com dados reais.",
    emoji: "🟡",
  },
  {
    id: "conhecer_planos",
    title: "Conhecer os planos",
    description: "Entenda os benefícios de cada plano e como assinar.",
    feature: "chat_acesso_ferramentas",
    botTag: "chat_upsell",
    starterUserMessage: "Quero conhecer os planos disponíveis.",
  },
];

/** Only the lottery topics shown in the selector (excludes conhecer_planos) */
export const LOTTERY_TOPICS = CHAT_TOPICS.filter((t) => t.id !== "conhecer_planos");

export function getChatTopic(id: ChatTopicId) {
  return CHAT_TOPICS.find((t) => t.id === id);
}
