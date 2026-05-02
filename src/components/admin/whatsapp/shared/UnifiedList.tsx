import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface UnifiedListProps {
  children: ReactNode;
  empty?: {
    icon: any;
    message: string;
    submessage?: string;
  };
  isLoading?: boolean;
  count?: number;
  total?: number;
}

export function UnifiedList({ children, empty, isLoading, count, total }: UnifiedListProps) {
  if (isLoading) return null; // Loading should be handled by the parent if needed

  if (count === 0 && empty) {
    const Icon = empty.icon;
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2 border border-dashed rounded-xl bg-muted/20">
        <Icon className="h-8 w-8 opacity-40" />
        <p className="text-sm font-medium">{empty.message}</p>
        {empty.submessage && <p className="text-[11px] opacity-70">{empty.submessage}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {children}
      </div>
      {(total !== undefined || count !== undefined) && (
        <p className="text-[10px] text-muted-foreground text-center py-2 uppercase tracking-widest font-semibold opacity-70">
          {count ?? total} registro(s) {total !== undefined && count !== undefined && count !== total ? `exibidos de ${total}` : ""}
        </p>
      )}
    </div>
  );
}

interface UnifiedCardItemProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function UnifiedCardItem({ children, onClick, className }: UnifiedCardItemProps) {
  const Component = onClick ? "button" : "div";
  return (
    <Component
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border border-border bg-card p-4 space-y-2 transition-all duration-200",
        onClick && "hover:bg-muted/40 hover:shadow-sm cursor-pointer active:scale-[0.99]",
        className
      )}
    >
      {children}
    </Component>
  );
}
