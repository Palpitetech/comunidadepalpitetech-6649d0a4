import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Check, ChevronDown, Clock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  CustomRange,
  PERIOD_OPTIONS,
  PeriodKey,
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
  const [calendarOpen, setCalendarOpen] = useState(false);
  const currentOption = PERIOD_OPTIONS.find((p) => p.key === value);

  const customLabel =
    customRange.from && customRange.to
      ? `${format(customRange.from, "dd/MM", { locale: ptBR })} - ${format(customRange.to, "dd/MM", { locale: ptBR })}`
      : "Escolher datas";

  const triggerLabel =
    value === "custom" && customRange.from && customRange.to
      ? customLabel
      : currentOption?.label || "Período";

  return (
    <div className="flex items-center gap-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className={cn(
              "gap-1.5 font-medium",
              compact ? "h-7 text-xs px-2.5" : "h-8 text-xs px-3"
            )}
          >
            <Clock className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
            <span className="truncate max-w-[140px]">{triggerLabel}</span>
            <ChevronDown className={cn("opacity-60", compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 bg-popover border border-border shadow-lg"
        >
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Período de análise
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {PERIOD_OPTIONS.filter((p) => p.key !== "custom").map((p) => (
            <DropdownMenuItem
              key={p.key}
              onClick={() => onChange(p.key)}
              className={cn(
                "cursor-pointer text-xs",
                value === p.key && "bg-accent font-semibold"
              )}
            >
              <span className="flex-1">{p.label}</span>
              {value === p.key && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              onChange("custom");
              setCalendarOpen(true);
            }}
            className={cn(
              "cursor-pointer text-xs",
              value === "custom" && "bg-accent font-semibold"
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5 mr-2" />
            <span className="flex-1">
              {value === "custom" && customRange.from && customRange.to
                ? customLabel
                : "Personalizado…"}
            </span>
            {value === "custom" && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Popover separado para o calendário, controlado programaticamente */}
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <span className="sr-only" aria-hidden />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={{ from: customRange.from, to: customRange.to }}
            onSelect={(range) => {
              onCustomRangeChange({ from: range?.from, to: range?.to });
              if (range?.from && range?.to) {
                setCalendarOpen(false);
              }
            }}
            numberOfMonths={2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
