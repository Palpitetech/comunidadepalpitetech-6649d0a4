import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatarDezena } from "@/lib/lotofacil";
import { useToast } from "@/hooks/use-toast";
import { 
  Lightbulb, 
  Target, 
  Ban, 
  Filter, 
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  CopyCheck
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface DezenaInfo {
  dezenas: number[];
  motivo: string;
}

interface FiltroInfo {
  filtro: string;
  valor_alvo?: string;
  motivo: string;
}

export interface EstrategiaData {
  ferramentas: string[];
  dezenas_fixas?: DezenaInfo[];
  dezenas_evitadas?: DezenaInfo[];
  filtros_aplicados: FiltroInfo[];
  conclusao: string;
}

interface EstrategiaCardProps {
  estrategia: EstrategiaData;
  className?: string;
}

export function EstrategiaCard({ estrategia, className }: EstrategiaCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const hasFixas = estrategia.dezenas_fixas && estrategia.dezenas_fixas.length > 0;
  const hasEvitadas = estrategia.dezenas_evitadas && estrategia.dezenas_evitadas.length > 0;

  const formatarEstrategiaParaCopia = () => {
    let texto = "📊 ESTRATÉGIA UTILIZADA\n\n";
    
    // Ferramentas
    texto += "🔧 Ferramentas:\n";
    estrategia.ferramentas.forEach(f => {
      texto += `  • ${f}\n`;
    });
    
    // Dezenas Fixas
    if (hasFixas) {
      texto += "\n✅ Dezenas Priorizadas:\n";
      estrategia.dezenas_fixas!.forEach(item => {
        texto += `  • ${item.dezenas.map(formatarDezena).join(", ")}\n    ${item.motivo}\n`;
      });
    }
    
    // Dezenas Evitadas
    if (hasEvitadas) {
      texto += "\n❌ Dezenas Evitadas:\n";
      estrategia.dezenas_evitadas!.forEach(item => {
        texto += `  • ${item.dezenas.map(formatarDezena).join(", ")}\n    ${item.motivo}\n`;
      });
    }
    
    // Filtros
    if (estrategia.filtros_aplicados.length > 0) {
      texto += "\n🎯 Filtros Aplicados:\n";
      estrategia.filtros_aplicados.forEach(f => {
        texto += `  • ${f.filtro}${f.valor_alvo ? ` → ${f.valor_alvo}` : ""}\n    ${f.motivo}\n`;
      });
    }
    
    // Conclusão
    texto += `\n💡 Conclusão:\n${estrategia.conclusao}`;
    
    return texto;
  };

  const handleCopiarEstrategia = async () => {
    const texto = formatarEstrategiaParaCopia();
    await navigator.clipboard.writeText(texto);
    
    setIsCopied(true);
    toast({
      title: "Estratégia copiada! 📋",
      description: "Você pode compartilhar ou guardar a estratégia utilizada.",
    });
    
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Card className={cn("border-primary/20 bg-primary/5", className)}>
      <CardHeader 
        className="pb-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            Estratégia Utilizada
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                handleCopiarEstrategia();
              }}
              title="Copiar estratégia"
            >
              {isCopied ? (
                <CopyCheck className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* Ferramentas - Sempre visível */}
        <div className="flex flex-wrap gap-1.5">
          {estrategia.ferramentas.map((ferramenta, i) => (
            <Badge 
              key={i} 
              variant="secondary" 
              className="text-[10px] px-2 py-0.5"
            >
              {ferramenta}
            </Badge>
          ))}
        </div>

        {/* Conclusão - Sempre visível */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          {estrategia.conclusao}
        </p>

        {/* Detalhes expandidos */}
        {isExpanded && (
          <div className="space-y-3 pt-2 border-t border-border/50">
            {/* Dezenas Fixas */}
            {hasFixas && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Target className="h-3.5 w-3.5 text-green-600" />
                  Dezenas Priorizadas
                </div>
                {estrategia.dezenas_fixas!.map((item, i) => (
                  <div key={i} className="pl-5 space-y-1">
                    <div className="flex flex-wrap gap-1">
                      {item.dezenas.map((d) => (
                        <span
                          key={d}
                          className="w-6 h-6 flex items-center justify-center rounded bg-green-100 text-green-700 text-[10px] font-bold"
                        >
                          {formatarDezena(d)}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{item.motivo}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Dezenas Evitadas */}
            {hasEvitadas && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Ban className="h-3.5 w-3.5 text-red-600" />
                  Dezenas Evitadas
                </div>
                {estrategia.dezenas_evitadas!.map((item, i) => (
                  <div key={i} className="pl-5 space-y-1">
                    <div className="flex flex-wrap gap-1">
                      {item.dezenas.map((d) => (
                        <span
                          key={d}
                          className="w-6 h-6 flex items-center justify-center rounded bg-red-100 text-red-700 text-[10px] font-bold"
                        >
                          {formatarDezena(d)}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{item.motivo}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Filtros Aplicados */}
            {estrategia.filtros_aplicados.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Filter className="h-3.5 w-3.5 text-blue-600" />
                  Filtros de Padrões
                </div>
                <div className="pl-5 space-y-2">
                  {estrategia.filtros_aplicados.map((filtro, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3 w-3 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[10px] font-medium text-foreground">
                          {filtro.filtro}
                          {filtro.valor_alvo && (
                            <span className="text-muted-foreground"> → {filtro.valor_alvo}</span>
                          )}
                        </span>
                        <p className="text-[10px] text-muted-foreground">{filtro.motivo}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Indicador de expandir */}
        {!isExpanded && (hasFixas || hasEvitadas || estrategia.filtros_aplicados.length > 0) && (
          <button
            onClick={() => setIsExpanded(true)}
            className="text-[10px] text-primary font-medium"
          >
            Ver detalhes da estratégia →
          </button>
        )}
      </CardContent>
    </Card>
  );
}
