import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarDays, ChevronDown } from "lucide-react";

interface PeriodoAnaliseSelectorProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const PERIODOS = {
  curto: [1, 2, 3, 4, 5],
  medio: [6, 7, 8, 9, 10],
  longo: [15, 20, 30, 50],
};

export function PeriodoAnaliseSelector({
  value,
  onChange,
  disabled = false,
}: PeriodoAnaliseSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Analisar últimos concursos
      </label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-11"
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span>Últimos <strong>{value}</strong> concursos</span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-popover" align="start">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Curto Prazo
          </DropdownMenuLabel>
          <DropdownMenuGroup>
            {PERIODOS.curto.map((p) => (
              <DropdownMenuItem
                key={p}
                onClick={() => onChange(p)}
                className={value === p ? "bg-primary/10 text-primary" : ""}
              >
                {p} {p === 1 ? "concurso" : "concursos"}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Médio Prazo
          </DropdownMenuLabel>
          <DropdownMenuGroup>
            {PERIODOS.medio.map((p) => (
              <DropdownMenuItem
                key={p}
                onClick={() => onChange(p)}
                className={value === p ? "bg-primary/10 text-primary" : ""}
              >
                {p} concursos
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Histórico
          </DropdownMenuLabel>
          <DropdownMenuGroup>
            {PERIODOS.longo.map((p) => (
              <DropdownMenuItem
                key={p}
                onClick={() => onChange(p)}
                className={value === p ? "bg-primary/10 text-primary" : ""}
              >
                {p} concursos
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <p className="text-[10px] text-muted-foreground">
        {value <= 5 
          ? "Foco em tendências recentes" 
          : value <= 10 
            ? "Equilíbrio entre recente e histórico"
            : "Análise com maior base histórica"
        }
      </p>
    </div>
  );
}
