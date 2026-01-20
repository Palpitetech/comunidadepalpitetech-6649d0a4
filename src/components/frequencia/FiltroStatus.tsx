import { Flame, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg">
      {opcoes.map((opcao) => {
        const isActive = selecionado === opcao.value;

        return (
          <button
            key={opcao.value}
            onClick={() => onChange(opcao.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              isActive
                ? opcao.activeClass
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {opcao.icon}
            <span>{opcao.label}</span>
            <span
              className={cn(
                "text-xs ml-0.5",
                isActive ? "opacity-80" : "opacity-60"
              )}
            >
              ({opcao.count})
            </span>
          </button>
        );
      })}
    </div>
  );
}
