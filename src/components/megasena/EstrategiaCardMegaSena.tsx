import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, XCircle, Filter, Lightbulb } from "lucide-react";
import type { EstrategiaMegaSena } from "@/hooks/useAutoFillMegaSena";
import { cn } from "@/lib/utils";

interface EstrategiaCardMegaSenaProps {
  estrategia: EstrategiaMegaSena;
  onClose?: () => void;
}

export function EstrategiaCardMegaSena({ estrategia, onClose }: EstrategiaCardMegaSenaProps) {
  const formatDezena = (n: number) => n.toString().padStart(2, "0");

  return (
    <Card className="border-megasena-primary/30 bg-megasena-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-megasena-primary text-base">
          <Sparkles className="h-5 w-5" />
          Estratégia da IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ferramentas utilizadas */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Ferramentas de Análise:</p>
          <div className="flex flex-wrap gap-1">
            {estrategia.ferramentas.map((ferramenta, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {ferramenta}
              </Badge>
            ))}
          </div>
        </div>

        {/* Dezenas justificadas */}
        {estrategia.dezenas_justificadas?.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-megasena-primary" />
              Dezenas Selecionadas:
            </p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {estrategia.dezenas_justificadas.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className={cn(
                    "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0",
                    "bg-megasena-primary text-megasena-primary-foreground"
                  )}>
                    {formatDezena(item.dezena)}
                  </span>
                  <span className="text-muted-foreground text-xs leading-relaxed pt-1">
                    {item.motivo}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dezenas evitadas */}
        {estrategia.dezenas_evitadas && estrategia.dezenas_evitadas.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <XCircle className="h-3 w-3 text-destructive" />
              Dezenas Evitadas:
            </p>
            <div className="space-y-1">
              {estrategia.dezenas_evitadas.map((item, i) => (
                <div key={i} className="text-xs text-muted-foreground">
                  <span className="font-medium text-destructive">
                    {item.dezenas.map(formatDezena).join(", ")}
                  </span>
                  {" - "}{item.motivo}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtros aplicados */}
        {estrategia.filtros_aplicados?.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Filtros Aplicados:
            </p>
            <div className="space-y-1">
              {estrategia.filtros_aplicados.map((filtro, i) => (
                <div key={i} className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{filtro.filtro}</span>
                  {filtro.valor_alvo && ` (${filtro.valor_alvo})`}
                  {" - "}{filtro.motivo}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conclusão */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Lightbulb className="h-3 w-3 text-amber-500" />
            Conclusão:
          </p>
          <p className="text-sm text-foreground">{estrategia.conclusao}</p>
        </div>
      </CardContent>
    </Card>
  );
}
