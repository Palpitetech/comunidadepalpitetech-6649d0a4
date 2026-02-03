import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QuantidadeSelector } from "@/components/gerador/QuantidadeSelector";
import { JogoCard } from "@/components/gerador/JogoCard";
import { EstrategiaCard } from "@/components/gerador/EstrategiaCard";
import { useGerador } from "@/hooks/useGerador";
import { Dices, Loader2, RefreshCw, Sparkles, AlertCircle } from "lucide-react";

export default function Gerador() {
  const [quantidade, setQuantidade] = useState(3);
  const { isLoading, result, error, generatePalpites, reset } = useGerador();

  const handleGenerate = () => {
    generatePalpites(quantidade);
  };

  const handleReset = () => {
    reset();
    setQuantidade(3);
  };

  return (
    <MainLayout>
      <div className="container-senior py-6 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Dices className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Gerador de Palpites</h1>
          </div>
          <p className="text-muted-foreground">
            Palpites inteligentes baseados em análise estatística
          </p>
        </div>

        {/* Seção de Geração */}
        {!result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Gerar Novos Palpites
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <QuantidadeSelector
                value={quantidade}
                onChange={setQuantidade}
                max={10}
                disabled={isLoading}
              />

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full h-14 text-lg gap-2"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Analisando dados...
                  </>
                ) : (
                  <>
                    <Dices className="h-5 w-5" />
                    Gerar {quantidade} Palpite{quantidade > 1 ? "s" : ""}
                  </>
                )}
              </Button>

              {isLoading && (
                <div className="space-y-4">
                  <div className="text-center text-sm text-muted-foreground">
                    O PT Analista está analisando os últimos 50 concursos...
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4 mx-auto" />
                    <Skeleton className="h-4 w-1/2 mx-auto" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resultados */}
        {result && (
          <div className="space-y-6">
            {/* Botão de novo sorteio */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {result.remaining_today > 0 ? (
                  <span>
                    Você ainda pode gerar <strong>{result.remaining_today}</strong> vez(es) hoje
                  </span>
                ) : (
                  <span className="text-amber-500">Limite diário atingido</span>
                )}
              </div>
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Novo Sorteio
              </Button>
            </div>

            {/* Estratégia */}
            <EstrategiaCard estrategia={result.estrategia} />

            {/* Grid de Jogos */}
            <div className="grid gap-4 md:grid-cols-2">
              {result.jogos.map((jogo, index) => (
                <JogoCard
                  key={index}
                  numero={index + 1}
                  dezenas={jogo.dezenas}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
