import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, Snowflake } from "lucide-react";

interface DezenaCardProps {
  dezena: number;
  ultimaVez: number;
  maiorSequencia: number;
  maiorAtraso: number;
  frequencia: number;
  melhorDupla: number;
  correlacaoDupla: number;
  melhorTrio: [number, number];
  correlacaoTrio: number;
  status: "quente" | "frio" | "normal";
}

function formatDezena(n: number): string {
  return n.toString().padStart(2, "0");
}

export function DezenaCard({
  dezena,
  ultimaVez,
  maiorSequencia,
  maiorAtraso,
  frequencia,
  melhorDupla,
  melhorTrio,
  status,
}: DezenaCardProps) {
  return (
    <Card className="bg-card border border-border/40 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          {/* Dezena Circle */}
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2",
              status === "quente" && "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-300",
              status === "frio" && "bg-slate-50 border-slate-300 text-slate-600 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-400",
              status === "normal" && "bg-secondary border-border text-foreground"
            )}
          >
            {formatDezena(dezena)}
          </div>

          {/* Status Badge */}
          {status === "quente" && (
            <Badge
              variant="secondary"
              className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 gap-1.5 px-3 py-1 text-xs font-medium"
            >
              <Flame className="h-3 w-3" />
              Quente
            </Badge>
          )}
          {status === "frio" && (
            <Badge
              variant="secondary"
              className="bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700 gap-1.5 px-3 py-1 text-xs font-medium"
            >
              <Snowflake className="h-3 w-3" />
              Fria
            </Badge>
          )}
        </div>

        {/* Data List */}
        <div className="space-y-3">
          <DataRow label="Última vez" value={`#${ultimaVez}`} />
          <DataRow label="Maior Sequência" value={`${maiorSequencia}x`} />
          <DataRow label="Maior Atraso" value={`${maiorAtraso}`} />
          <DataRow
            label="Frequência"
            value={`${frequencia}%`}
            valueClassName={cn(
              status === "quente" && "text-emerald-600 dark:text-emerald-400",
              status === "frio" && "text-slate-500 dark:text-slate-400"
            )}
          />
          <DataRow
            label="Melhor Dupla"
            value={formatDezena(melhorDupla)}
          />
          <DataRow
            label="Melhor Trio"
            value={`${formatDezena(melhorTrio[0])} e ${formatDezena(melhorTrio[1])}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface DataRowProps {
  label: string;
  value: string;
  valueClassName?: string;
}

function DataRow({ label, value, valueClassName }: DataRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground tracking-wide uppercase">
        {label}
      </span>
      <span className={cn("text-sm font-medium text-foreground", valueClassName)}>
        {value}
      </span>
    </div>
  );
}
