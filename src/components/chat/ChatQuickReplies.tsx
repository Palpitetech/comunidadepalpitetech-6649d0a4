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
        <div className="text-sm text-foreground">Escolha uma opção:</div>
        <div className="space-y-2">
          {topics.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onPick(t)}
              className="w-full rounded-xl border border-border bg-background/70 px-4 py-3 text-left text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>
    </ChatMessageBubble>
  );
}
