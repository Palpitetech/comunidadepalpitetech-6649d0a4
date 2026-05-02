import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UnifiedToolbarProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
}

export function UnifiedToolbar({ left, right }: UnifiedToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-2 flex-wrap mb-4 sticky top-0 md:relative z-20 bg-background/95 backdrop-blur-sm py-2 -mx-2 px-2 rounded-md">
      <div className="flex items-center gap-2 flex-wrap">
        {left}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {right}
      </div>
    </div>
  );
}

interface ActionButtonProps {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  hideLabelOnMobile?: boolean;
}

export function ActionButton({
  label,
  icon: Icon,
  onClick,
  variant = "outline",
  loading = false,
  disabled = false,
  className,
  hideLabelOnMobile = true
}: ActionButtonProps) {
  return (
    <Button
      variant={variant}
      size="sm"
      className={cn("gap-1.5 text-xs h-8", className)}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? <Icon className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
      <span className={cn(hideLabelOnMobile && "hidden sm:inline")}>{label}</span>
    </Button>
  );
}
