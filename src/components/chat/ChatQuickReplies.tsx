import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble";
import type { ChatTopic } from "@/lib/chatTopics";

interface ChatQuickRepliesProps {
  topics: ChatTopic[];
  onPick: (topic: ChatTopic) => void;
}

export function ChatQuickReplies({ topics, onPick }: ChatQuickRepliesProps) {
  return (
    <div className="space-y-2">
      {topics.map((t) => (
        <div key={t.id} className="flex justify-start">
          <ChatMessageBubble
            role="assistant"
            content={t.title}
            clickable
            onClick={() => onPick(t)}
            className="text-left"
          />
        </div>
      ))}
    </div>
  );
}
