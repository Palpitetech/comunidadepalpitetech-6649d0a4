import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChartBar, ChevronDown, Lightbulb } from "lucide-react";
import { useState } from "react";

interface EstrategiaCardProps {
  estrategia: string;
}

export function EstrategiaCard({ estrategia }: EstrategiaCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="border-border">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors rounded-lg">
            <div className="flex items-center gap-2">
              <ChartBar className="h-5 w-5 text-primary" />
              <span className="font-semibold">Metodologia Aplicada</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm">
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
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
