import { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import type { ChatMessageActions } from "@/hooks/useChat";

export type ChatBubbleRole = "user" | "assistant";

interface ChatMessageBubbleProps {
  role: ChatBubbleRole;
  content: string;
  children?: ReactNode;
  timeLabel?: string;
  showTail?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
  actions?: ChatMessageActions | null;
}

export function ChatMessageBubble({
  role,
  content,
  children,
  timeLabel,
  showTail = true,
  clickable = false,
  onClick,
  className,
  actions,
}: ChatMessageBubbleProps) {
  const isUser = role === "user";
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const bubbleClassName = cn(
    "chat-bubble",
    isUser ? "chat-bubble--right" : "chat-bubble--left",
    showTail && (isUser ? "chat-bubble--tail-right" : "chat-bubble--tail-left"),
    clickable && "chat-bubble--clickable",
    className
  );

  const body = (
    <>
      {children ? (
        <div className="w-full">{children}</div>
      ) : (
        <div className="whitespace-pre-wrap break-words">{content}</div>
      )}

      {actions?.upgrade && (
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full border-[hsl(var(--vip))] text-[hsl(var(--vip))] hover:bg-[hsl(var(--vip))]/10 font-semibold"
          onClick={() => setUpgradeOpen(true)}
        >
          👑 Conhecer Plano Anual VIP
        </Button>
      )}

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

      {actions?.upgrade && (
        <UpgradeModal
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
          featureLabel="Chat com IA"
          variant="vip"
        />
      )}
    </>
  );

  if (clickable) {
    return (
      <button type="button" onClick={onClick} className={bubbleClassName}>
        {body}
      </button>
    );
  }

  return (
    <div className={bubbleClassName}>
      {body}
    </div>
  );
}
