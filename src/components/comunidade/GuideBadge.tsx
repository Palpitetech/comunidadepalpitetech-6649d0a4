import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuideBadgeProps {
  className?: string;
}

export function GuideBadge({ className }: GuideBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
        "bg-[#1E3A5F] text-blue-100 text-xs font-medium",
        "border border-blue-700/50",
        className
      )}
    >
      <Shield className="h-3 w-3" />
      Especialista
    </span>
  );
}
