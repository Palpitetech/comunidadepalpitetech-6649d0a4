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
          size="lg"
          className="h-12 px-5 gap-3 text-base font-medium border-border/60 bg-card hover:bg-secondary/50 shadow-sm"
        >
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>
            Analisar: <span className="font-semibold">Últimos {selecionado}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
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
