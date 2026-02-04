import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartBar, Lightbulb } from "lucide-react";

interface EstrategiaCardProps {
  estrategia: string;
}

export function EstrategiaCard({ estrategia }: EstrategiaCardProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/10 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <ChartBar className="h-5 w-5 text-primary" />
          Estratégia Utilizada
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
          {estrategia}
        </p>
        <div className="flex items-start gap-2 p-3 bg-secondary rounded-lg border border-border">
          <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Lembre-se:</strong> Loteria é probabilidade. 
            Os palpites são baseados em análise estatística, mas não garantem premiação. 
            Jogue com responsabilidade!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
