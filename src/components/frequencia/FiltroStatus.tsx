import { useState } from "react";
import { Flame, Snowflake, Filter, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type StatusFiltro = "todas" | "quente" | "frio";

interface FiltroStatusProps {
  selecionado: StatusFiltro;
  onChange: (status: StatusFiltro) => void;
  contagem: {
    todas: number;
    quentes: number;
    frias: number;
  };
}

export function FiltroStatus({
  selecionado,
  onChange,
  contagem,
}: FiltroStatusProps) {
  const [open, setOpen] = useState(false);

  const opcoes: {
    value: StatusFiltro;
    label: string;
    count: number;
    icon?: React.ReactNode;
    activeClass: string;
  }[] = [
    {
      value: "todas",
      label: "Todas",
      count: contagem.todas,
      activeClass: "bg-secondary text-foreground",
    },
    {
      value: "quente",
      label: "Quentes",
      count: contagem.quentes,
      icon: <Flame className="h-3.5 w-3.5" />,
      activeClass: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    },
    {
      value: "frio",
      label: "Frias",
      count: contagem.frias,
      icon: <Snowflake className="h-3.5 w-3.5" />,
      activeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    },
  ];

  const selecionadoOpcao = opcoes.find((o) => o.value === selecionado);

  const handleSelect = (value: StatusFiltro) => {
    onChange(value);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
            "border border-border/50 hover:border-border hover:bg-muted/50",
            "text-muted-foreground"
          )}
        >
          <Filter className="h-4 w-4" />
          <span>Filtro:</span>
          <span
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-md text-xs",
              selecionadoOpcao?.activeClass
            )}
          >
            {selecionadoOpcao?.icon}
            {selecionadoOpcao?.label}
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-48 p-2 bg-popover border border-border shadow-md"
        align="start"
      >
        <div className="flex flex-col gap-1">
          {opcoes.map((opcao) => {
            const isActive = selecionado === opcao.value;

            return (
              <button
                key={opcao.value}
                onClick={() => handleSelect(opcao.value)}
                className={cn(
                  "flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm transition-all w-full text-left",
                  isActive
                    ? opcao.activeClass
                    : "text-foreground hover:bg-muted"
                )}
              >
                <span className="flex items-center gap-2">
                  {opcao.icon}
                  {opcao.label}
                </span>
                <span className="text-xs opacity-60">({opcao.count})</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
