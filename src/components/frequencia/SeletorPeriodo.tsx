import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SeletorPeriodoProps {
  periodos: number[];
  selecionado: number;
  onChange: (periodo: number) => void;
}

export function SeletorPeriodo({
  periodos,
  selecionado,
  onChange,
}: SeletorPeriodoProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-9 sm:h-10 px-3 sm:px-4 gap-1.5 sm:gap-2 text-sm font-medium border-border/60 bg-card hover:bg-secondary/50 shadow-sm"
        >
          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="truncate">
            <span className="hidden sm:inline">Período: </span>
            <span className="font-semibold">Últimos {selecionado}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 bg-card border-border shadow-lg">
        {periodos.map((periodo) => (
          <DropdownMenuItem
            key={periodo}
            onClick={() => onChange(periodo)}
            className={`text-base py-3 cursor-pointer ${
              selecionado === periodo ? "bg-secondary font-medium" : ""
            }`}
          >
            Últimos {periodo} concursos
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
