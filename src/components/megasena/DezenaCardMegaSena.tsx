import { cn } from "@/lib/utils";
import { Flame, Snowflake, TrendingUp, Users, CalendarClock, Repeat } from "lucide-react";

interface DezenaCardMegaSenaProps {
  dezena: number;
  ultimaVez: number;
  maiorSequencia: number;
  maiorAtraso: number;
  frequencia: number;
  melhorDupla: number;
  correlacaoDupla: number;
  status: "quente" | "frio" | "normal";
}

export function DezenaCardMegaSena({
  dezena,
  ultimaVez,
  maiorSequencia,
  maiorAtraso,
  frequencia,
  melhorDupla,
  correlacaoDupla,
  status,
}: DezenaCardMegaSenaProps) {
  const statusConfig = {
    quente: {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      border: "border-emerald-200 dark:border-emerald-800",
      badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
      icon: <Flame className="w-3 h-3" />,
      label: "Quente",
    },
    frio: {
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800",
      badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      icon: <Snowflake className="w-3 h-3" />,
      label: "Fria",
    },
    normal: {
      bg: "bg-card",
      border: "border-border",
      badge: "bg-muted text-muted-foreground",
      icon: null,
      label: "Normal",
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "rounded-xl border p-3 transition-all",
        config.bg,
        config.border
      )}
    >
      {/* Header: Dezena + Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
            {dezena.toString().padStart(2, "0")}
          </span>
        </div>
        {status !== "normal" && (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
              config.badge
            )}
          >
            {config.icon}
            {config.label}
          </span>
        )}
      </div>

      {/* Métricas Compactas */}
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <CalendarClock className="w-3 h-3" />
            Última vez
          </span>
          <span className="font-medium">#{ultimaVez}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <Repeat className="w-3 h-3" />
            Maior seq.
          </span>
          <span className="font-medium">{maiorSequencia}x</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Frequência
          </span>
          <span className={cn(
            "font-semibold",
            status === "quente" && "text-emerald-600 dark:text-emerald-400",
            status === "frio" && "text-blue-600 dark:text-blue-400"
          )}>
            {frequencia}%
          </span>
        </div>

        {melhorDupla > 0 && (
          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <span className="text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              Melhor dupla
            </span>
            <span className="font-medium">
              {melhorDupla.toString().padStart(2, "0")} ({correlacaoDupla}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
