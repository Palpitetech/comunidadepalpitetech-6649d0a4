import { ArrowUpDown, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type OrdenacaoTipo = 
  | "dezena" 
  | "recentes" 
  | "quentes" 
  | "frias" 
  | "sequencia" 
  | "atraso";

interface OpcaoOrdenacao {
  valor: OrdenacaoTipo;
  label: string;
}

const OPCOES: OpcaoOrdenacao[] = [
  { valor: "dezena", label: "Por Número" },
  { valor: "recentes", label: "Mais Recentes" },
  { valor: "quentes", label: "Mais Quentes" },
  { valor: "frias", label: "Mais Frias" },
  { valor: "sequencia", label: "Maior Sequência" },
  { valor: "atraso", label: "Maior Atraso" },
];

interface SeletorOrdenacaoProps {
  selecionado: OrdenacaoTipo;
  onChange: (ordenacao: OrdenacaoTipo) => void;
}

export function SeletorOrdenacao({
  selecionado,
  onChange,
}: SeletorOrdenacaoProps) {
  const opcaoAtual = OPCOES.find((o) => o.valor === selecionado);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-9 sm:h-10 px-3 sm:px-4 gap-1.5 sm:gap-2 text-sm font-medium border-border/60 bg-card hover:bg-secondary/50 shadow-sm"
        >
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="truncate">
            <span className="hidden sm:inline">Ordenar: </span>
            <span className="font-semibold">{opcaoAtual?.label}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 bg-card border-border shadow-lg">
        {OPCOES.map((opcao) => (
          <DropdownMenuItem
            key={opcao.valor}
            onClick={() => onChange(opcao.valor)}
            className={`text-base py-3 cursor-pointer ${
              selecionado === opcao.valor ? "bg-secondary font-medium" : ""
            }`}
          >
            {opcao.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
