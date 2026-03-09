import { Gem } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumBadgeProps {
  variant?: "premium" | "vip";
  className?: string;
  size?: "sm" | "md";
}

/**
 * Premium badge: purple diamond for paid features, gold diamond for VIP-exclusive features.
 * Inspired by CapCut's premium indicator style.
 */
export function PremiumBadge({ variant = "premium", className, size = "sm" }: PremiumBadgeProps) {
  const isVip = variant === "vip";
  const sizeClass = size === "sm" ? "h-3.5 w-3.5" : "h-4.5 w-4.5";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center shrink-0",
        isVip
          ? "text-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.5)]"
          : "text-purple-400 drop-shadow-[0_0_3px_rgba(168,85,247,0.5)]",
        className
      )}
      title={isVip ? "Exclusivo Anual VIP" : "Recurso Premium"}
    >
      <Gem className={sizeClass} />
    </span>
  );
}
