import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";
import type { EstrategiaFechamentoMegaSenaUI } from "@/lib/fechamentoMegaSena";

interface FechamentoRulesCardMegaSenaProps {
  estrategia: EstrategiaFechamentoMegaSenaUI;
}

export function FechamentoRulesCardMegaSena({ estrategia }: FechamentoRulesCardMegaSenaProps) {
  // Texto dinâmico baseado na garantia
  const getTextoGarantia = () => {
    const pontos = estrategia.garantia;
    const dezenas = estrategia.dezenas;
    
    if (pontos === 6) {
      return `Garantia de SENA caso acerte as ${dezenas} dezenas sorteadas!`;
    }
    if (pontos === 5) {
      return `Garantia de QUINA caso 6 das ${dezenas} dezenas sejam sorteadas`;
    }
    if (pontos === 4) {
      return `Garantia de QUADRA caso 5 das ${dezenas} dezenas sejam sorteadas`;
    }
    return estrategia.condicao;
  };

  return (
    <Card className="border-emerald-500/30 bg-emerald-950/20">
      <CardContent className="py-4 flex items-start gap-3">
        <Shield className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-emerald-400">
            {estrategia.nome} - {estrategia.jogos} jogos
          </h4>
          <p className="text-xs text-muted-foreground">
            {getTextoGarantia()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
