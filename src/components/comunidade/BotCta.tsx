import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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
      // Verifica se é URL externa
      if (action.url.startsWith("http://") || action.url.startsWith("https://")) {
        window.open(action.url, "_blank", "noopener,noreferrer");
      } else {
        navigate(action.url);
      }
    } else if (action.type === "open_chat_topic" && action.topic) {
      // Navega para o chat com o tópico específico
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
    <div className="mt-3 pt-3 border-t border-border">
      {text && (
        <p className="text-sm text-muted-foreground mb-2">{text}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {buttons.slice(0, 3).map((button, index) => (
          <Button
            key={index}
            variant="default"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleClick(button.action);
            }}
            className="text-sm"
          >
            {button.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
