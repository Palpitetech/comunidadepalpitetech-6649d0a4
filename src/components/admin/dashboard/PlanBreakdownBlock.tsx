import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package } from "lucide-react";
import { PlanBreakdownItem, fmtBRL } from "@/hooks/admin/useDashboardMetrics";
import { PeriodFilter } from "./PeriodFilter";
import { CustomRange, PeriodKey } from "@/hooks/useDashboardPeriod";

interface PlanBreakdownBlockProps {
  title: string;
  items: PlanBreakdownItem[];
  loading?: boolean;
  emptyMessage?: string;
  countLabel?: string;
  isStateOnly?: boolean;
  showLocalFilter?: boolean;
  localPeriodKey?: PeriodKey;
  onLocalPeriodChange?: (key: PeriodKey) => void;
  localCustomRange?: CustomRange;
  onLocalCustomRangeChange?: (r: CustomRange) => void;
}

export function PlanBreakdownBlock({
  title,
  items,
  loading,
  emptyMessage = "Nenhuma venda no período",
  countLabel = "vendas",
  isStateOnly,
  showLocalFilter,
  localPeriodKey,
  onLocalPeriodChange,
  localCustomRange,
  onLocalCustomRangeChange,
}: PlanBreakdownBlockProps) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            {title}
          </h3>
          {isStateOnly ? (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
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
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : items.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">{emptyMessage}</p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((it) => (
              <li
                key={it.name}
                className="flex items-center justify-between gap-2 text-sm py-1 border-b border-border/40 last:border-0"
              >
                <span className="font-medium truncate">{it.name}</span>
                <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-2">
                  <span className="font-semibold text-foreground">{it.vendas}</span>
                  <span>{countLabel}</span>
                  <span className="text-primary font-medium">{fmtBRL(it.total)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
