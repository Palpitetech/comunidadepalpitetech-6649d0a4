import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QuantidadeSelector } from "@/components/gerador/QuantidadeSelector";
import { JogoLista } from "@/components/gerador/JogoLista";
import { EstrategiaCard } from "@/components/gerador/EstrategiaCard";
import { useGerador } from "@/hooks/useGerador";
import { useGeradorStatus } from "@/hooks/useGeradorStatus";
import { Dices, Loader2, RefreshCw, AlertCircle, Clock } from "lucide-react";

export default function Gerador() {
  const [quantidade, setQuantidade] = useState(3);
  const { isLoading, result, error, generatePalpites, reset } = useGerador();
  const { remaining_today, max_per_day, isLoading: statusLoading, refetch } = useGeradorStatus();

  const canGenerate = remaining_today > 0;

  const handleGenerate = () => {
    generatePalpites(quantidade);
  };

  useEffect(() => {
    if (result) {
      refetch();
    }
  }, [result]);

  const handleReset = () => {
    reset();
    setQuantidade(3);
  };

  return (
    <MainLayout>
      <div className="container-senior py-6 space-y-6 max-w-2xl mx-auto">
        {/* Header compacto */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Dices className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold">Gerador de Palpites</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Palpites baseados em análise estatística
          </p>
        </div>

        {/* Seção de Geração */}
        {!result && (
          <Card>
            <CardContent className="pt-6 space-y-5">
              {/* Status de uso */}
              {!statusLoading && (
                <div className={`flex items-center justify-center gap-2 p-3 rounded-lg ${
                  canGenerate 
                    ? "bg-primary/10 text-primary" 
                    : "bg-destructive/10 text-destructive"
                }`}>
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {canGenerate ? (
                      <>Você pode gerar <strong>{remaining_today}</strong> vez(es) hoje</>
                    ) : (
                      <>Limite diário atingido. Volte amanhã!</>
                    )}
                  </span>
                </div>
              )}

              <QuantidadeSelector
                value={quantidade}
                onChange={setQuantidade}
                max={12}
                disabled={isLoading || !canGenerate}
              />

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={isLoading || !canGenerate}
                className="w-full h-14 text-lg gap-2"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Analisando dados...
                  </>
                ) : !canGenerate ? (
                  <>
                    <Clock className="h-5 w-5" />
                    Aguarde até amanhã
                  </>
                ) : (
                  <>
                    <Dices className="h-5 w-5" />
                    Gerar {quantidade} Palpite{quantidade > 1 ? "s" : ""}
                  </>
                )}
              </Button>

              {isLoading && (
                <div className="space-y-3">
                  <div className="text-center text-sm text-muted-foreground">
                    Analisando os últimos 50 concursos...
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 mx-auto" />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resultados */}
        {result && (
          <div className="space-y-4">
            {/* Ações */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {result.remaining_today > 0 ? (
                  <span>
                    Restam <strong>{result.remaining_today}</strong> geração(ões) hoje
                  </span>
                ) : (
                  <span>Limite diário atingido</span>
                )}
              </div>
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Nova Geração
              </Button>
            </div>

            {/* Lista de Jogos */}
            <JogoLista jogos={result.jogos} />

            {/* Estratégia (colapsável) */}
            <EstrategiaCard estrategia={result.estrategia} />
          </div>
        )}
      </div>
    </MainLayout>
  );
}
