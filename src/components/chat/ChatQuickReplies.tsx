import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble";
import { Badge } from "@/components/ui/badge";
import type { ChatTopic } from "@/lib/chatTopics";

interface ChatQuickRepliesProps {
  topics: ChatTopic[];
  onPick: (topic: ChatTopic) => void;
}

const VIP_TOPIC_IDS = new Set(["boloes", "estrategias", "estrategias_duplasena"]);

export function ChatQuickReplies({ topics, onPick }: ChatQuickRepliesProps) {
  return (
    <ChatMessageBubble role="assistant" content="" showTail>
      <div className="space-y-3">
        <div className="text-sm text-foreground">Escolha uma opção:</div>
        <div className="space-y-2">
          {topics.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onPick(t)}
              className="w-full rounded-xl border border-border bg-background/70 px-4 py-3 text-left text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <span className="flex items-center gap-2">
                {t.title}
                {VIP_TOPIC_IDS.has(t.id) && (
                  <Badge variant="outline" className="border-[hsl(var(--vip))] text-[hsl(var(--vip))] text-[0.65rem] px-1.5 py-0">
                    👑 VIP
                  </Badge>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </ChatMessageBubble>
  );
}
