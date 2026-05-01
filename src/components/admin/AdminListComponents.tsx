import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

/**
 * AdminListContainer - Wrapper padronizado para listagens admin densas.
 */
export function AdminListContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("divide-y divide-border/40 border-b border-border/40", className)}>
      {children}
    </div>
  );
}

interface AdminListItemProps {
  title: string;
  subtitle?: string;
  badge?: {
    text: string;
    color: string;
    icon?: any;
  };
  timestamp?: string;
  onClick?: () => void;
  rightContent?: ReactNode;
}

/**
 * AdminListItem - Item de linha ultra-compacto seguindo o Design System de Logs.
 */
export function AdminListItem({ 
  title, 
  subtitle, 
  badge, 
  timestamp, 
  onClick,
  rightContent 
}: AdminListItemProps) {
  const StatusIcon = badge?.icon;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 py-2.5 px-4 hover:bg-muted/30 active:bg-muted/50 transition-colors text-left group"
    >
      <div className="flex-1 min-w-0">
        {/* Linha 1: Título + Badge */}
        <div className="flex items-center justify-between gap-2 leading-tight">
          <span className="text-sm font-semibold text-foreground truncate max-w-[200px] sm:max-w-md">
            {title}
          </span>
          
          {badge && (
            <div className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight border shrink-0",
              badge.color
            )}>
              {StatusIcon && <StatusIcon className="h-2.5 w-2.5" />}
              {badge.text}
            </div>
          )}
        </div>

        {/* Linha 2: Subtítulo + Horário */}
        <div className="flex items-center justify-between gap-2 mt-1 leading-tight">
          <span className="text-[11px] text-muted-foreground/70 truncate italic text-left">
            {subtitle}
          </span>
          
          <div className="flex items-center gap-2 shrink-0">
            {rightContent}
            {timestamp && (
              <span className="text-[10px] font-medium text-muted-foreground/50 whitespace-nowrap">
                {timestamp}
              </span>
            )}
          </div>
        </div>
      </div>

      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-muted-foreground/40 transition-colors shrink-0 ml-1" />
    </button>
  );
}
