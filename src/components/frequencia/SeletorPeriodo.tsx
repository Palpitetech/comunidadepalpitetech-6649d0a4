import { CalendarDays, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const GRUPOS_PERIODOS = [
  {
    label: "Curto",
    periodos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },
  {
    label: "Médio",
    periodos: [15, 20, 25],
  },
  {
    label: "Longo",
    periodos: [50, 100],
  },
];

interface SeletorPeriodoProps {
  periodos?: number[];
  selecionado: number;
  onChange: (periodo: number) => void;
}

export function SeletorPeriodo({
  selecionado,
  onChange,
}: SeletorPeriodoProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-8 px-3 gap-1.5 text-xs font-medium rounded-full border-border/60 bg-transparent hover:bg-muted/50 shadow-none"
        >
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{selecionado} conc.</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-auto min-w-[180px] bg-popover border border-border shadow-lg rounded-xl p-2"
      >
        {GRUPOS_PERIODOS.map((grupo, index) => (
          <div key={grupo.label}>
            {index > 0 && <DropdownMenuSeparator className="my-1.5" />}
            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wide px-1 py-1">
              {grupo.label}
            </DropdownMenuLabel>
            <div className="flex flex-wrap gap-1">
              {grupo.periodos.map((periodo) => (
                <button
                  key={periodo}
                  onClick={() => onChange(periodo)}
                  className={cn(
                    "min-w-[28px] h-7 px-2 text-xs rounded-md cursor-pointer transition-colors",
                    selecionado === periodo
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {periodo}
                </button>
              ))}
            </div>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
