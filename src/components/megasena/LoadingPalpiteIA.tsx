import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Zap, TrendingUp } from "lucide-react";

const MENSAGENS_MOTIVACIONAIS = [
  "Analisando os últimos 10 concursos...",
  "Calculando frequência de dezenas...",
  "Avaliando padrões de pares e ímpares...",
  "Verificando números primos...",
  "Analisando moldura do volante...",
  "Processando estatísticas...",
  "Gerando sugestões inteligentes...",
  "Finalizando análise...",
  "Uau, você vai ter muitas chances!",
];

interface LoadingPalpiteIAProps {
  isLoading: boolean;
}

export function LoadingPalpiteIA({ isLoading }: LoadingPalpiteIAProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % MENSAGENS_MOTIVACIONAIS.length);
    }, 1200);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <Card className="border-highlight/30 bg-highlight/5 animate-fade-in">
      <CardContent className="py-6 px-4">
        <div className="flex items-start gap-4">
          {/* Animated Spinner */}
          <div className="flex-shrink-0 mt-1">
            <div className="relative w-8 h-8">
              {/* Outer rotating ring */}
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-highlight border-r-highlight animate-spin" />
              
              {/* Inner pulsing center */}
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-highlight/30 to-highlight/10 animate-pulse" />
              
              {/* Center sparkle */}
              <Sparkles className="absolute inset-0 m-auto h-4 w-4 text-highlight animate-scale-in" />
            </div>
          </div>

          {/* Message Section */}
          <div className="flex-1 min-w-0">
            <div className="space-y-2">
              {/* Main message with animation */}
              <div key={currentMessageIndex} className="animate-fade-in">
                <p className="text-sm font-medium text-highlight flex items-center gap-2">
                  <span className="inline-block">{MENSAGENS_MOTIVACIONAIS[currentMessageIndex]}</span>
                </p>
              </div>

              {/* Progress indicators */}
              <div className="flex gap-1 pt-1">
                {MENSAGENS_MOTIVACIONAIS.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      index <= currentMessageIndex
                        ? "w-4 bg-highlight"
                        : "w-1 bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Tips while loading */}
            <div className="mt-3 p-2 rounded-md bg-highlight/10 border border-highlight/20">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-highlight" />
                <span>
                  A IA analisa histórico, frequência, padrões de pares/ímpares e distribuição no volante
                </span>
              </div>
            </div>
          </div>

          {/* Decorative element */}
          <div className="hidden sm:flex flex-col gap-1 opacity-30">
            <Zap className="h-5 w-5 text-highlight animate-bounce" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
