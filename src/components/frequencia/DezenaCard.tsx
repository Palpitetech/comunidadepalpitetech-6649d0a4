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
  correlacaoDupla,
  melhorTrio,
  correlacaoTrio,
  status,
}: DezenaCardProps) {
  return (
    <Card className="bg-card border border-gray-100 dark:border-gray-800">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          {/* Dezena Circle */}
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2",
              status === "quente" && "bg-green-50 border-green-300 text-green-700 dark:bg-green-950 dark:border-green-700 dark:text-green-300",
              status === "frio" && "bg-blue-50 border-blue-300 text-blue-600 dark:bg-blue-950 dark:border-blue-700 dark:text-blue-300",
              status === "normal" && "bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300"
            )}
          >
            {formatDezena(dezena)}
          </div>

          {/* Status Badge */}
          {status === "quente" && (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-700 border border-green-200 hover:bg-green-100 dark:bg-green-900 dark:text-green-300 dark:border-green-800 gap-1.5 px-3 py-1 text-xs font-medium"
            >
              <Flame className="h-3 w-3" />
              Quente
            </Badge>
          )}
          {status === "frio" && (
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800 gap-1.5 px-3 py-1 text-xs font-medium"
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
              status === "quente" && "text-green-600 dark:text-green-400",
              status === "frio" && "text-blue-600 dark:text-blue-400"
            )}
          />
          <DataRow
            label="Melhor Dupla"
            value={`${formatDezena(melhorDupla)} (${correlacaoDupla}%)`}
          />
          <DataRow
            label="Melhor Trio"
            value={
              melhorTrio && melhorTrio[0] && melhorTrio[1]
                ? `${formatDezena(melhorTrio[0])} e ${formatDezena(melhorTrio[1])} (${correlacaoTrio}%)`
                : "—"
            }
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
