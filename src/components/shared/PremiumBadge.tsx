import { Gem } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumBadgeProps {
  variant?: "premium" | "vip";
  className?: string;
  size?: "sm" | "md";
}

/**
 * Diamond badge: purple for premium features, gold for VIP-exclusive.
 */
export function PremiumBadge({ variant = "premium", className, size = "sm" }: PremiumBadgeProps) {
  const isVip = variant === "vip";
  const sizeClass = size === "sm" ? "h-3.5 w-3.5" : "h-[18px] w-[18px]";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center shrink-0",
        isVip ? "text-[hsl(var(--vip))]" : "text-[hsl(var(--premium))]",
        className
      )}
      title={isVip ? "Exclusivo Anual VIP" : "Recurso Premium"}
    >
      <Gem className={cn(sizeClass, "fill-current")} />
    </span>
  );
}
