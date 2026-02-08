import { Card, CardContent } from "@/components/ui/card";
import { Hash, MousePointerClick, Shield, Target } from "lucide-react";
import { EstrategiaFechamento } from "./EstrategiaFechamentoSelector";

interface FechamentoRulesCardProps {
  estrategia: EstrategiaFechamento;
}

export function FechamentoRulesCard({ estrategia }: FechamentoRulesCardProps) {
  const regras = [
    {
      icon: Hash,
      texto: `Selecione ${estrategia.dezenas} números + Fixas (opcional)`,
    },
    {
      icon: MousePointerClick,
      texto: "Clique em Gerar",
    },
    {
      icon: Shield,
      texto: `Garantia: ${estrategia.garantia} pontos`,
    },
    {
      icon: Target,
      texto: estrategia.condicao,
    },
  ];

  return (
    <Card className="bg-muted/30 border-border">
      <CardContent className="p-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          O fechamento <strong className="text-foreground">"{estrategia.id}"</strong> tem as seguintes regras:
        </p>
        
        <ol className="space-y-2">
          {regras.map((regra, index) => (
            <li key={index} className="flex items-center gap-3 text-sm">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                {index + 1}
              </span>
              <regra.icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-foreground">{regra.texto}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
