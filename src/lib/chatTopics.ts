import type { FeatureKey } from "@/types/plans";

export type ChatTopicId =
  | "boloess"
  | "duvidas_ferramentas"
  | "duvidas_comunidade"
  | "acesso_ferramentas"
  | "estatisticas";

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
    id: "boloess",
    title: "Quero conhecer os bolões",
    description: "Entenda como funcionam e como participar.",
    feature: "chat_boloes",
    botTag: "chat_boloes",
    starterUserMessage: "Quero conhecer os bolões.",
  },
  {
    id: "duvidas_ferramentas",
    title: "Dúvidas das ferramentas",
    description: "Ajuda com Resultados, Tendências e Quentes/Frias.",
    feature: "chat_duvidas_ferramentas",
    botTag: "chat_duvidas_ferramentas",
    starterUserMessage: "Tenho dúvidas sobre as ferramentas.",
  },
  {
    id: "duvidas_comunidade",
    title: "Dúvidas da Comunidade",
    description: "Regras, boas práticas e como aproveitar melhor.",
    feature: "chat_duvidas_comunidade",
    botTag: "chat_duvidas_comunidade",
    starterUserMessage: "Tenho dúvidas sobre a comunidade.",
  },
  {
    id: "acesso_ferramentas",
    title: "Quero ter acesso às ferramentas",
    description: "Entenda quais planos liberam cada recurso.",
    feature: "chat_acesso_ferramentas",
    botTag: "chat_acesso_ferramentas",
    starterUserMessage: "Quero ter acesso às ferramentas.",
  },
  {
    id: "estatisticas",
    title: "Quero conversar sobre estatísticas",
    description: "Estratégias, leitura de padrões e visão crítica.",
    feature: "chat_estatisticas",
    botTag: "chat_estatisticas",
    starterUserMessage: "Quero conversar sobre estatísticas e estratégias.",
  },
];

export function getChatTopic(id: ChatTopicId) {
  return CHAT_TOPICS.find((t) => t.id === id);
}
