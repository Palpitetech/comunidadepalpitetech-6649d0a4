import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ChatAvatarProps {
  label?: string;
}

export function ChatAvatar({ label = "Palpite Tech" }: ChatAvatarProps) {
  return (
    <Avatar className="h-9 w-9 shadow-sm">
      <AvatarImage src="/logo.png" alt={label} />
      <AvatarFallback className="bg-gradient-to-br from-[#6b1d6e] to-[#930089] text-white text-xs font-bold">
        <span className="sr-only">{label}</span>
        PT
      </AvatarFallback>
    </Avatar>
  );
}
