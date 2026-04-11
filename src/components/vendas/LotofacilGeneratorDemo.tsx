import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dices, Loader2, Sparkles, TrendingUp, Cpu, History } from "lucide-react";

export function LotofacilGeneratorDemo() {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [simulationCount, setSimulationCount] = useState(1458);
  const [analysisText, setAnalysisText] = useState("");

  const steps = [
    "Carregando histórico...",
    "Calculando frequência...",
    "Aplicando filtros AI...",
    "Gerando combinação otimizada..."
  ];

  const generate = () => {
    setIsGenerating(true);
    setNumbers([]);
    
    let currentStep = 0;
    const interval = setInterval(() => {
      setAnalysisText(steps[currentStep]);
      currentStep++;
      if (currentStep >= steps.length) clearInterval(interval);
    }, 400);

    // Simulate "AI Analysis"
    setTimeout(() => {
      const allNumbers = Array.from({ length: 25 }, (_, i) => i + 1);
      const selected: number[] = [];
      const tempAll = [...allNumbers];
      for (let i = 0; i < 15; i++) {
        const randomIndex = Math.floor(Math.random() * tempAll.length);
        selected.push(tempAll.splice(randomIndex, 1)[0]);
      }
      setNumbers(selected.sort((a, b) => a - b));
      setIsGenerating(false);
      setSimulationCount(prev => prev + 1);
    }, 1800);
  };

  return (
    <Card className="w-full max-w-sm mx-auto overflow-hidden border-2 border-primary/20 shadow-2xl animate-in fade-in zoom-in duration-500 bg-card/50 backdrop-blur-sm">
      <CardHeader className="bg-primary text-primary-foreground py-4">
        <CardTitle className="text-base flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          SIMULADOR INTELIGENTE
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <TrendingUp className="h-3 w-3 text-primary" />
            Probabilidade Alta
          </div>
          <div className="text-[10px] font-bold text-primary/60 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
            MODO: DEMONSTRATIVO
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {Array.from({ length: 25 }, (_, i) => i + 1).map((n) => (
            <div
              key={n}
              className={`
                h-10 w-10 flex items-center justify-center rounded-full text-xs font-extrabold transition-all duration-300
                ${numbers.includes(n) 
                  ? "bg-[#FFD700] text-[#1A1A1A] scale-110 shadow-[0_0_15px_rgba(255,215,0,0.4)] ring-2 ring-white" 
                  : "bg-muted/30 text-muted-foreground/30 border border-border/50"}
              `}
            >
              {n.toString().padStart(2, "0")}
            </div>
          ))}
        </div>

        <Button 
          onClick={generate} 
          disabled={isGenerating}
          className="w-full h-12 text-sm sm:text-base font-bold gap-2 bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] active:scale-[0.98] border-b-4 border-accent-foreground/20"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {analysisText}
            </>
          ) : (
            <>
              <Dices className="h-5 w-5" />
              GERAR JOGO AGORA
            </>
          )}
        </Button>

        <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground font-semibold">
           <div className="flex items-center gap-1">
             <History className="h-3 w-3" />
             {simulationCount.toLocaleString()} Simulações hoje
           </div>
           <div className="flex items-center gap-1">
             <Cpu className="h-3 w-3" />
             SLA: 0.1ms
           </div>
        </div>

        {numbers.length > 0 && !isGenerating && (
          <div className="text-center animate-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-2">
               <p className="text-[10px] text-primary font-black italic uppercase leading-tight">
                 ESTA É UMA SUGESTÃO BÁSICA COM FILTROS PADRÃO.
               </p>
               <p className="text-[9px] text-muted-foreground font-medium">
                 Para utilizar filtros de repetidas, pares/ímpares, ciclos e dezenas fixas, acesse a plataforma completa.
               </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
