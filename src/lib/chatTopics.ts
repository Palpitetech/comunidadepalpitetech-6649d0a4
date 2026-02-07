import type { FeatureKey } from "@/types/plans";

export type ChatTopicId =
  | "boloes"
  | "estrategias"
  | "conhecer_planos";

export interface ChatTopic {
  id: ChatTopicId;
  title: string;
  description: string;
  feature: FeatureKey;
  botTag: string;
  starterUserMessage: string;
}

export const CHAT_TOPICS: ChatTopic[] = [
  {
    id: "boloes",
    title: "Conhecer os bolões",
    description: "Entenda como funcionam e como participar dos grupos.",
    feature: "chat_boloes",
    botTag: "chat_boloes",
    starterUserMessage: "Quero conhecer os bolões disponíveis.",
  },
  {
    id: "estrategias",
    title: "Estratégias e ferramentas",
    description: "Dicas de estratégias e como usar as ferramentas do sistema.",
    feature: "chat_duvidas_ferramentas",
    botTag: "chat_duvidas_ferramentas",
    starterUserMessage: "Quero aprender estratégias e conhecer as ferramentas.",
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

export function getChatTopic(id: ChatTopicId) {
  return CHAT_TOPICS.find((t) => t.id === id);
}
