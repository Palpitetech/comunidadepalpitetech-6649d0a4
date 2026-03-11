import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CtaAction {
  type: "navigate" | "open_chat_topic";
  url?: string;
  topic?: string;
  autoSend?: boolean;
  message?: string;
}

interface CtaButton {
  label: string;
  action: CtaAction;
}

interface BotCtaProps {
  text?: string | null;
  buttons: CtaButton[];
}

export function BotCta({ text, buttons }: BotCtaProps) {
  const navigate = useNavigate();

  const handleClick = (action: CtaAction) => {
    if (action.type === "navigate" && action.url) {
      if (action.url.startsWith("http://") || action.url.startsWith("https://")) {
        window.open(action.url, "_blank", "noopener,noreferrer");
      } else {
        navigate(action.url);
      }
    } else if (action.type === "open_chat_topic" && action.topic) {
      const params = new URLSearchParams({ topic: action.topic });
      if (action.autoSend && action.message) {
        params.set("message", action.message);
        params.set("autoSend", "true");
      }
      navigate(`/chat?${params.toString()}`);
    }
  };

  if (!buttons || buttons.length === 0) return null;

  return (
    <div className="flex items-start gap-2 mt-3">
      <div
        className={cn(
          "relative max-w-[85%] rounded-2xl rounded-tl-sm px-3.5 py-2.5",
          "bg-muted text-foreground",
          "shadow-sm"
        )}
      >
        {text && (
          <p className="text-[13px] leading-snug mb-2">{text}</p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {buttons.slice(0, 3).map((button, index) => (
            <Button
              key={index}
              variant="default"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleClick(button.action);
              }}
              className="text-xs h-8 rounded-lg"
            >
              {button.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
