import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QuantidadeSelector } from "@/components/gerador/QuantidadeSelector";
import { DezenasSelector } from "@/components/gerador/DezenasSelector";
import { ResultadosSheet } from "@/components/gerador/ResultadosSheet";
import { useGerador } from "@/hooks/useGerador";
import { useGeradorStatus } from "@/hooks/useGeradorStatus";
import { supabase } from "@/integrations/supabase/client";
import { Dices, Loader2, Clock, AlertCircle } from "lucide-react";

export default function Gerador() {
  const [quantidade, setQuantidade] = useState(3);
  const [qtdDezenas, setQtdDezenas] = useState(15);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [ultimoConcursoDezenas, setUltimoConcursoDezenas] = useState<number[]>([]);
  
  const { isLoading, result, error, generatePalpites, reset } = useGerador();
  const { remaining_today, max_per_day, isLoading: statusLoading, refetch, isAdmin } = useGeradorStatus();

  const canGenerate = isAdmin || remaining_today > 0;

  // Buscar último concurso para cálculo de repetidas
  useEffect(() => {
    const fetchUltimoConcurso = async () => {
      const { data } = await supabase
        .from("resultados")
        .select("dezenas")
        .order("concurso_id", { ascending: false })
        .limit(1)
        .single();
      
      if (data?.dezenas) {
        setUltimoConcursoDezenas(data.dezenas);
      }
    };
    fetchUltimoConcurso();
  }, []);

  const handleGenerate = () => {
    generatePalpites(quantidade, qtdDezenas);
  };

  // Abrir sheet quando resultado chegar
  useEffect(() => {
    if (result) {
      refetch();
      setSheetOpen(true);
    }
  }, [result]);

  const handleClearAll = () => {
    reset();
    setQuantidade(3);
    setQtdDezenas(15);
  };

  return (
    <MainLayout>
      <div className="container-senior py-6 space-y-6 max-w-md mx-auto">
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

        {/* Card de Configuração */}
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Seletor de Quantidade de Palpites */}
            <QuantidadeSelector
              value={quantidade}
              onChange={setQuantidade}
              max={12}
              disabled={isLoading || !canGenerate}
            />

            {/* Seletor de Dezenas por Palpite */}
            <DezenasSelector
              value={qtdDezenas}
              onChange={setQtdDezenas}
              disabled={isLoading || !canGenerate}
            />

            {/* Erro */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Botão de Gerar */}
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

            {/* Loading skeleton */}
            {isLoading && (
              <div className="space-y-3">
                <div className="text-center text-sm text-muted-foreground">
                  Analisando os últimos 50 concursos...
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mx-auto" />
              </div>
            )}

            {/* Status de uso - discreto no rodapé */}
            {!statusLoading && (
              <div className={`flex items-center justify-center gap-2 p-3 rounded-lg ${
                canGenerate 
                  ? "bg-muted/50 text-muted-foreground" 
                  : "bg-destructive/10 text-destructive"
              }`}>
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  {isAdmin ? (
                    <>🛡️ Modo Admin: <strong>Geração ilimitada</strong></>
                  ) : canGenerate ? (
                    <>Você pode gerar <strong>{remaining_today}</strong> vez(es) hoje</>
                  ) : (
                    <>Limite diário atingido. Volte amanhã!</>
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sheet de Resultados */}
        {result && (
          <ResultadosSheet
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            jogos={result.jogos}
            ultimoConcursoDezenas={ultimoConcursoDezenas}
            onClearAll={handleClearAll}
          />
        )}
      </div>
    </MainLayout>
  );
}
