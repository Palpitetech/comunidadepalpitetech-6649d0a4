import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  CustomRange,
  PERIOD_OPTIONS,
  PeriodKey,
  resolvePeriod,
} from "@/hooks/useDashboardPeriod";

interface PeriodFilterProps {
  value: PeriodKey;
  onChange: (key: PeriodKey) => void;
  customRange: CustomRange;
  onCustomRangeChange: (range: CustomRange) => void;
  compact?: boolean;
}

export function PeriodFilter({
  value,
  onChange,
  customRange,
  onCustomRangeChange,
  compact = false,
}: PeriodFilterProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <Select value={value} onValueChange={(v) => onChange(v as PeriodKey)}>
          <SelectTrigger className="h-7 text-xs w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((p) => (
              <SelectItem key={p.key} value={p.key} className="text-xs">
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {value === "custom" && (
          <CustomRangePopover
            customRange={customRange}
            onCustomRangeChange={onCustomRangeChange}
            compact
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {PERIOD_OPTIONS.filter((p) => p.key !== "custom").map((p) => (
        <Button
          key={p.key}
          size="sm"
          variant={value === p.key ? "default" : "outline"}
          onClick={() => onChange(p.key)}
          className="h-8 text-xs px-3"
        >
          {value === p.key && <Check className="h-3 w-3 mr-1" />}
          {p.label}
        </Button>
      ))}
      <CustomRangePopover
        customRange={customRange}
        onCustomRangeChange={onCustomRangeChange}
        active={value === "custom"}
        onActivate={() => onChange("custom")}
      />
    </div>
  );
}

function CustomRangePopover({
  customRange,
  onCustomRangeChange,
  active = false,
  onActivate,
  compact = false,
}: {
  customRange: CustomRange;
  onCustomRangeChange: (range: CustomRange) => void;
  active?: boolean;
  onActivate?: () => void;
  compact?: boolean;
}) {
  const label =
    customRange.from && customRange.to
      ? `${format(customRange.from, "dd/MM", { locale: ptBR })} - ${format(customRange.to, "dd/MM", { locale: ptBR })}`
      : "Escolher datas";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant={active ? "default" : "outline"}
          onClick={onActivate}
          className={cn("h-8 text-xs px-3 gap-1.5", compact && "h-7")}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          {compact ? label : `📅 ${label}`}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="range"
          selected={{ from: customRange.from, to: customRange.to }}
          onSelect={(range) => {
            onCustomRangeChange({ from: range?.from, to: range?.to });
            if (onActivate) onActivate();
          }}
          numberOfMonths={2}
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  );
}
