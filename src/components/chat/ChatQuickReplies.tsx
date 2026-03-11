import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble";
import type { ChatTopic } from "@/lib/chatTopics";
import { ChevronRight } from "lucide-react";

interface ChatQuickRepliesProps {
  topics: ChatTopic[];
  onPick: (topic: ChatTopic) => void;
}

const LOTTERY_CARDS: Record<string, { gradient: string; subtitle: string; icon: string }> = {
  "🟢": {
    gradient: "from-[#6b1d6e] to-[#930089]",
    subtitle: "15 dezenas • 25 números",
    icon: "🍀",
  },
  "🔵": {
    gradient: "from-[#14694a] to-[#209869]",
    subtitle: "6 dezenas • 60 números",
    icon: "🟢",
  },
  "🟡": {
    gradient: "from-[#8a1a1f] to-[#c1272d]",
    subtitle: "6 dezenas • 50 números • 2 sorteios",
    icon: "🔴",
  },
};

export function ChatQuickReplies({ topics, onPick }: ChatQuickRepliesProps) {
  return (
    <ChatMessageBubble role="assistant" content="" showTail>
      <div className="space-y-3">
        {/* AI Presentation */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">
            🤖 IA de Análise Palpite Tech
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Inteligência artificial avançada para análise de loterias.
            Padrões, ciclos, frequências e tendências com dados reais.
          </p>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-1">
            <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[0.6rem] font-medium text-secondary-foreground">
              🧠 Tempo real
            </span>
            <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[0.6rem] font-medium text-secondary-foreground">
              📊 +47k linhas
            </span>
            <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[0.6rem] font-medium text-secondary-foreground">
              🎯 Dados reais
            </span>
          </div>
        </div>

        <div className="border-t border-border pt-2">
          <p className="text-xs text-muted-foreground mb-2">Escolha a loteria:</p>
          <div className="space-y-2">
            {topics.map((t) => {
              const card = LOTTERY_CARDS[t.emoji ?? ""] ?? {
                gradient: "from-muted to-muted",
                subtitle: "",
                icon: "🎰",
              };
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onPick(t)}
                  className={`w-full flex items-center gap-3 rounded-2xl bg-gradient-to-r ${card.gradient} px-4 py-4 text-left text-white shadow-md transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]`}
                >
                  <span className="text-2xl shrink-0">{card.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold leading-tight">{t.title}</p>
                    <p className="text-[0.65rem] text-white/70 mt-0.5">{card.subtitle}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/60 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </ChatMessageBubble>
  );
}