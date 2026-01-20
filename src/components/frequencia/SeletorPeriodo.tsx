import { CalendarDays, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const GRUPOS_PERIODOS = [
  {
    label: "Curto Prazo",
    periodos: [3, 5, 10],
  },
  {
    label: "Médio Prazo",
    periodos: [15, 20, 25],
  },
  {
    label: "Histórico",
    periodos: [50, 100],
  },
];

interface SeletorPeriodoProps {
  periodos: number[];
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
          className="h-10 px-4 gap-2 text-sm font-medium rounded-full border-border/60 bg-transparent hover:bg-muted/50 shadow-none"
        >
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span>
            Analisar: <strong>{selecionado}</strong> Concursos
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52 bg-popover border border-border shadow-lg rounded-xl p-1"
      >
        {GRUPOS_PERIODOS.map((grupo, index) => (
          <div key={grupo.label}>
            {index > 0 && <DropdownMenuSeparator className="my-1" />}
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wide px-3 py-2">
              {grupo.label}
            </DropdownMenuLabel>
            {grupo.periodos.map((periodo) => (
              <DropdownMenuItem
                key={periodo}
                onClick={() => onChange(periodo)}
                className={cn(
                  "text-sm py-2.5 px-3 rounded-lg cursor-pointer",
                  selecionado === periodo &&
                    "bg-primary/10 text-primary font-medium"
                )}
              >
                {periodo} concursos
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
