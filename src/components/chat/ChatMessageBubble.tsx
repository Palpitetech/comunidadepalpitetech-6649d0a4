import { cn } from "@/lib/utils";

export type ChatBubbleRole = "user" | "assistant";

interface ChatMessageBubbleProps {
  role: ChatBubbleRole;
  content: string;
  timeLabel?: string;
  showTail?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ChatMessageBubble({
  role,
  content,
  timeLabel,
  showTail = true,
  clickable = false,
  onClick,
  className,
}: ChatMessageBubbleProps) {
  const isUser = role === "user";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={cn(
        "chat-bubble",
        isUser ? "chat-bubble--right" : "chat-bubble--left",
        showTail && (isUser ? "chat-bubble--tail-right" : "chat-bubble--tail-left"),
        clickable && "chat-bubble--clickable",
        className
      )}
    >
      <div className="whitespace-pre-wrap break-words">{content}</div>
      {timeLabel ? (
        <div
          className={cn(
            "mt-2 flex justify-end text-[0.70rem] leading-none",
            isUser ? "text-primary-foreground/80" : "text-muted-foreground"
          )}
        >
          {timeLabel}
        </div>
      ) : null}
    </button>
  );
}
