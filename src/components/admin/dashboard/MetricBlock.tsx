import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PeriodFilter } from "./PeriodFilter";
import { CustomRange, PeriodKey, PeriodRange } from "@/hooks/useDashboardPeriod";

interface MetricBlockProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  subInfo?: ReactNode;
  loading?: boolean;
  accent?: "default" | "success" | "warning" | "danger" | "info";
  // Filtro local (modo "por bloco")
  showLocalFilter?: boolean;
  localPeriodKey?: PeriodKey;
  onLocalPeriodChange?: (key: PeriodKey) => void;
  localCustomRange?: CustomRange;
  onLocalCustomRangeChange?: (r: CustomRange) => void;
  // Estado atual (ignora período)
  isStateOnly?: boolean;
  className?: string;
}

const ACCENTS: Record<string, string> = {
  default: "text-foreground",
  success: "text-green-600",
  warning: "text-yellow-600",
  danger: "text-red-600",
  info: "text-blue-600",
};

export function MetricBlock({
  title,
  value,
  icon: Icon,
  subInfo,
  loading,
  accent = "default",
  showLocalFilter,
  localPeriodKey,
  onLocalPeriodChange,
  localCustomRange,
  onLocalCustomRangeChange,
  isStateOnly,
  className,
}: MetricBlockProps) {
  return (
    <Card className={cn("border-border/60", className)}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
            <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
          </div>
          {isStateOnly ? (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">
              estado atual
            </Badge>
          ) : showLocalFilter && localPeriodKey && onLocalPeriodChange ? (
            <PeriodFilter
              compact
              value={localPeriodKey}
              onChange={onLocalPeriodChange}
              customRange={localCustomRange || {}}
              onCustomRangeChange={onLocalCustomRangeChange || (() => {})}
            />
          ) : null}
        </div>
        <div>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <p className={cn("text-2xl md:text-3xl font-bold leading-none", ACCENTS[accent])}>
              {value}
            </p>
          )}
        </div>
        {subInfo && !loading && (
          <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1">{subInfo}</div>
        )}
      </CardContent>
    </Card>
  );
}
