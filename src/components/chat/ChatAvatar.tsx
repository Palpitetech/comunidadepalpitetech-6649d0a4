import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot } from "lucide-react";

interface ChatAvatarProps {
  label?: string;
}

export function ChatAvatar({ label = "Especialista" }: ChatAvatarProps) {
  return (
    <Avatar className="h-8 w-8 border">
      <AvatarFallback className="bg-muted">
        <span className="sr-only">{label}</span>
        <Bot className="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
  );
}
