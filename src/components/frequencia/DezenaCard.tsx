import { cn } from "@/lib/utils";
import { DezenaCirculo } from "@/components/lotofacil/DezenaCirculo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Flame, Snowflake, Users } from "lucide-react";

interface DezenaCardProps {
  dezena: number;
  ultimaVez: number;
  maiorSequencia: number;
  maiorAtraso: number;
  frequencia: number;
  melhorDupla: number;
  correlacaoDupla: number;
  status: "quente" | "frio" | "normal";
}

export function DezenaCard({
  dezena,
  ultimaVez,
  maiorSequencia,
  maiorAtraso,
  frequencia,
  melhorDupla,
  correlacaoDupla,
  status,
}: DezenaCardProps) {
  return (
    <Card
      className={cn(
        "min-w-[200px] transition-all duration-200 hover:shadow-lg",
        status === "quente" && "border-status-quente/50 bg-status-quente-bg dark:bg-status-quente/10",
        status === "frio" && "border-status-frio/50 bg-status-frio-bg dark:bg-status-frio/10"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <DezenaCirculo dezena={dezena} size="lg" showMoldura showPrimo />
          {status === "quente" && (
            <Badge className="bg-status-quente hover:bg-status-quente/90 text-status-quente-foreground gap-1">
              <Flame className="h-3.5 w-3.5" />
              Quente
            </Badge>
          )}
          {status === "frio" && (
            <Badge variant="secondary" className="bg-status-frio-bg text-status-frio-foreground gap-1">
              <Snowflake className="h-3.5 w-3.5" />
              Fria
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-base">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Última vez:</span>
          <span className="font-semibold">#{ultimaVez}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Maior Sequência:</span>
          <span className="font-semibold">{maiorSequencia}x</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Maior Atraso:</span>
          <span className="font-semibold">{maiorAtraso} conc.</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Frequência:</span>
          <span
            className={cn(
              "font-bold text-lg",
              status === "quente" && "text-status-quente",
              status === "frio" && "text-status-frio"
            )}
          >
            {frequencia}%
          </span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="text-muted-foreground flex items-center gap-1">
            <Users className="h-4 w-4" />
            Melhor Dupla:
          </span>
          <span className="font-semibold">
            {melhorDupla.toString().padStart(2, "0")}{" "}
            <span className="text-muted-foreground text-sm">({correlacaoDupla}%)</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
