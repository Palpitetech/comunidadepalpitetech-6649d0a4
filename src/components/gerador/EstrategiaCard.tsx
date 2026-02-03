import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Lightbulb } from "lucide-react";

interface EstrategiaCardProps {
  estrategia: string;
}

export function EstrategiaCard({ estrategia }: EstrategiaCardProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/10 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Estratégia Utilizada
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
          {estrategia}
        </p>
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
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
