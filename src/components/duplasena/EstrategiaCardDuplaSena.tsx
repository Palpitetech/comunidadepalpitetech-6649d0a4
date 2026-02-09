import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sparkles, CheckCircle2, XCircle, Filter, Lightbulb, Copy, Check, ChevronDown } from "lucide-react";
import type { EstrategiaDuplaSena } from "@/hooks/useAutoFillDuplaSena";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface EstrategiaCardDuplaSenaProps {
  estrategia: EstrategiaDuplaSena;
  defaultOpen?: boolean;
}

export function EstrategiaCardDuplaSena({ estrategia, defaultOpen = false }: EstrategiaCardDuplaSenaProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const formatDezena = (n: number) => n.toString().padStart(2, "0");

  const handleCopiar = async () => {
    try {
      let texto = "🎯 ESTRATÉGIA DUPLA SENA - PALPITE TECH\n";
      texto += "═══════════════════════════════════════\n\n";
      texto += "📊 FERRAMENTAS UTILIZADAS:\n";
      estrategia.ferramentas.forEach((f) => { texto += `   • ${f}\n`; });
      texto += "\n";
      if (estrategia.dezenas_justificadas?.length > 0) {
        texto += "🔢 DEZENAS SELECIONADAS:\n";
        estrategia.dezenas_justificadas.forEach((item) => {
          texto += `   ${formatDezena(item.dezena)} → ${item.motivo}\n`;
        });
        texto += "\n";
      }
      if (estrategia.conclusao) {
        texto += "💡 CONCLUSÃO:\n";
        texto += `   ${estrategia.conclusao}\n\n`;
      }
      texto += "═══════════════════════════════════════\nGerado por Palpite Tech 🍀";
      await navigator.clipboard.writeText(texto);
      setCopied(true);
      toast({ title: "Copiado!", description: "Estratégia copiada para a área de transferência." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-duplasena-primary/30 bg-duplasena-primary/5 animate-fade-in">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-duplasena-primary text-base">
              <Sparkles className="h-5 w-5" />
              Estratégia da IA
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={handleCopiar}
                className="h-7 text-xs gap-1 border-duplasena-primary/30 hover:bg-duplasena-primary/10">
                {copied ? <Check className="h-3 w-3 text-duplasena-primary" /> : <Copy className="h-3 w-3" />}
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground">
                  {isOpen ? "Menos" : "Ver mais"}
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", isOpen && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
          {!isOpen && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {estrategia.dezenas_justificadas?.map((item, i) => (
                  <span key={i} className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-duplasena-primary text-duplasena-primary-foreground">
                    {formatDezena(item.dezena)}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {estrategia.ferramentas.slice(0, 3).join(" • ")}
                {estrategia.ferramentas.length > 3 && ` +${estrategia.ferramentas.length - 3}`}
              </p>
            </div>
          )}
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-2">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Ferramentas de Análise:</p>
              <div className="flex flex-wrap gap-1">
                {estrategia.ferramentas.map((f, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{f}</Badge>
                ))}
              </div>
            </div>
            {estrategia.dezenas_justificadas?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-duplasena-primary" />
                  Dezenas Selecionadas ({estrategia.dezenas_justificadas.length}):
                </p>
                <div className="grid gap-2">
                  {estrategia.dezenas_justificadas.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-duplasena-primary/5 border-border hover:border-duplasena-primary/30">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm shrink-0 bg-duplasena-primary text-duplasena-primary-foreground shadow-sm">
                        {formatDezena(item.dezena)}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed flex-1 min-w-0">{item.motivo}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {estrategia.dezenas_evitadas && estrategia.dezenas_evitadas.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-destructive" />
                  Dezenas Evitadas:
                </p>
                <div className="space-y-1.5">
                  {estrategia.dezenas_evitadas.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/20">
                      <div className="flex flex-wrap gap-1">
                        {item.dezenas.map((d) => (
                          <span key={d} className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-destructive/20 text-destructive">
                            {formatDezena(d)}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground flex-1">{item.motivo}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {estrategia.filtros_aplicados?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  Filtros Aplicados:
                </p>
                <div className="space-y-1">
                  {estrategia.filtros_aplicados.map((filtro, i) => (
                    <div key={i} className="text-xs text-muted-foreground p-2 rounded bg-muted/30">
                      <span className="font-medium text-foreground">{filtro.filtro}</span>
                      {filtro.valor_alvo && <Badge variant="outline" className="ml-2 text-xs h-5">{filtro.valor_alvo}</Badge>}
                      <span className="block mt-0.5">{filtro.motivo}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Lightbulb className="h-3 w-3 text-amber-500" />
                Conclusão:
              </p>
              <p className="text-sm text-foreground bg-amber-500/5 p-2 rounded-lg border border-amber-500/20">
                {estrategia.conclusao}
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
