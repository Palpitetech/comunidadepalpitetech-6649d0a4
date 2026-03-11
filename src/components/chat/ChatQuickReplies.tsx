import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble";
import type { ChatTopic } from "@/lib/chatTopics";

interface ChatQuickRepliesProps {
  topics: ChatTopic[];
  onPick: (topic: ChatTopic) => void;
}

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
            A inteligência artificial mais avançada do mercado para análise de loterias.
            Mais de 47.000 linhas de código treinadas para analisar padrões, ciclos,
            frequências e tendências com precisão estatística.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[0.65rem] font-medium text-secondary-foreground">
              🧠 Análise em tempo real
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[0.65rem] font-medium text-secondary-foreground">
              📊 +47k linhas de código
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[0.65rem] font-medium text-secondary-foreground">
              🎯 Dados reais dos concursos
            </span>
          </div>
        </div>

        <div className="border-t border-border pt-2">
          <p className="text-xs text-muted-foreground mb-2">Escolha a loteria:</p>
          <div className="space-y-2">
            {topics.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onPick(t)}
                className="w-full rounded-xl border border-border bg-background/70 px-4 py-3 text-left text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <span className="flex items-center gap-2">
                  {t.emoji && <span className="text-base">{t.emoji}</span>}
                  {t.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </ChatMessageBubble>
  );
}
