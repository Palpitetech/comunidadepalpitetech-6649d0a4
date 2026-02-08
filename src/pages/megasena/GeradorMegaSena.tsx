import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { QuantidadeSelector } from "@/components/gerador/QuantidadeSelector";
import { PeriodoAnaliseSelector } from "@/components/gerador/PeriodoAnaliseSelector";
import { PedidoEspecialInput } from "@/components/gerador/PedidoEspecialInput";
import { DezenasGridMegaSena } from "@/components/megasena/DezenasGridMegaSena";
import { ResultadosSheetMegaSena } from "@/components/megasena/ResultadosSheetMegaSena";
import { useGeradorMegaSena } from "@/hooks/useGeradorMegaSena";
import { useGeradorStatus } from "@/hooks/useGeradorStatus";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Dices, Loader2, Clock, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function GeradorMegaSena() {
  const isMobile = useIsMobile();
  const [quantidade, setQuantidade] = useState(3);
  const [periodoAnalise, setPeriodoAnalise] = useState(50);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [ultimoConcursoDezenas, setUltimoConcursoDezenas] = useState<number[]>([]);
  
  // Filtros
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [modoGrid, setModoGrid] = useState<"fixar" | "excluir">("fixar");
  const [dezenasFiexas, setDezenasFiexas] = useState<number[]>([]);
  const [dezenasExcluidas, setDezenasExcluidas] = useState<number[]>([]);
  const [pedidoEspecial, setPedidoEspecial] = useState("");
  
  const { isLoading, result, error, generatePalpites, reset } = useGeradorMegaSena();
  const { remaining_today, max_per_day, isLoading: statusLoading, refetch, isAdmin } = useGeradorStatus();

  const canGenerate = isAdmin || remaining_today > 0;

  // Buscar último concurso
  useEffect(() => {
    const fetchUltimoConcurso = async () => {
      const { data } = await supabase
        .from("resultados_megasena")
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

  const handleToggleDezena = (dezena: number) => {
    if (modoGrid === "fixar") {
      // Remove de excluídas se existir
      if (dezenasExcluidas.includes(dezena)) {
        setDezenasExcluidas(prev => prev.filter(d => d !== dezena));
      }
      // Toggle em fixas
      if (dezenasFiexas.includes(dezena)) {
        setDezenasFiexas(prev => prev.filter(d => d !== dezena));
      } else if (dezenasFiexas.length < 5) {
        setDezenasFiexas(prev => [...prev, dezena]);
      }
    } else {
      // Remove de fixas se existir
      if (dezenasFiexas.includes(dezena)) {
        setDezenasFiexas(prev => prev.filter(d => d !== dezena));
      }
      // Toggle em excluídas
      if (dezenasExcluidas.includes(dezena)) {
        setDezenasExcluidas(prev => prev.filter(d => d !== dezena));
      } else if (dezenasExcluidas.length < 10) {
        setDezenasExcluidas(prev => [...prev, dezena]);
      }
    }
  };

  const handleGenerate = () => {
    const filtros = {
      dezenasFiexas: dezenasFiexas.length > 0 ? dezenasFiexas : [],
      dezenasExcluidas: dezenasExcluidas.length > 0 ? dezenasExcluidas : [],
      pedidoEspecial: pedidoEspecial.trim() || undefined,
    };
    
    generatePalpites(quantidade, periodoAnalise, filtros);
  };

  useEffect(() => {
    if (result) {
      refetch();
      setSheetOpen(true);
    }
  }, [result]);

  const handleClearAll = () => {
    reset();
    setQuantidade(3);
    setPeriodoAnalise(50);
    setDezenasFiexas([]);
    setDezenasExcluidas([]);
    setPedidoEspecial("");
  };

  const temFiltrosAtivos = 
    dezenasFiexas.length > 0 || 
    dezenasExcluidas.length > 0 || 
    pedidoEspecial.trim().length > 0;

  return (
    <MainLayout pageTitle="Gerador Mega Sena">
      <div className="container-senior py-6 space-y-6 max-w-md mx-auto">
        {!isMobile && (
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Dices className="h-7 w-7 text-emerald-500" />
              <h1 className="text-2xl font-bold">Gerador Mega Sena</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Palpites inteligentes baseados em análise estatística
            </p>
          </div>
        )}

        <Card>
          <CardContent className="pt-6 space-y-6">
            <QuantidadeSelector
              value={quantidade}
              onChange={setQuantidade}
              max={12}
              disabled={isLoading || !canGenerate}
            />

            <PeriodoAnaliseSelector
              value={periodoAnalise}
              onChange={setPeriodoAnalise}
              disabled={isLoading || !canGenerate}
            />

            <Separator />

            <button
              type="button"
              onClick={() => setFiltrosAbertos(!filtrosAbertos)}
              className="w-full flex items-center justify-between py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-2">
                Filtros Avançados
                {temFiltrosAtivos && (
                  <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-600 rounded-full">
                    Ativos
                  </span>
                )}
              </span>
              {filtrosAbertos ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {filtrosAbertos && (
              <div className="space-y-4 pt-2">
                {/* Toggle de Modo */}
                <div className="space-y-2">
                  <ToggleGroup
                    type="single"
                    value={modoGrid}
                    onValueChange={(v) => v && setModoGrid(v as "fixar" | "excluir")}
                    className="w-full"
                  >
                    <ToggleGroupItem value="fixar" className="flex-1">
                      Fixar ({dezenasFiexas.length}/5)
                    </ToggleGroupItem>
                    <ToggleGroupItem value="excluir" className="flex-1">
                      Excluir ({dezenasExcluidas.length}/10)
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <p className="text-xs text-muted-foreground text-center">
                    {modoGrid === "fixar" 
                      ? "Toque para incluir dezenas obrigatórias" 
                      : "Toque para excluir dezenas indesejadas"}
                  </p>
                </div>

                {/* Grid de Dezenas */}
                <DezenasGridMegaSena
                  dezenasFiexas={dezenasFiexas}
                  dezenasExcluidas={dezenasExcluidas}
                  onToggleDezena={handleToggleDezena}
                  modo={modoGrid}
                  disabled={isLoading || !canGenerate}
                  ultimoConcursoDezenas={ultimoConcursoDezenas}
                />

                {/* Pedido Especial */}
                <PedidoEspecialInput
                  value={pedidoEspecial}
                  onChange={setPedidoEspecial}
                  disabled={isLoading || !canGenerate}
                />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={isLoading || !canGenerate}
              className="w-full h-14 text-lg gap-2 bg-emerald-600 hover:bg-emerald-700"
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
                  Analisando {periodoAnalise === 1 ? "o último concurso" : `os últimos ${periodoAnalise} concursos`}...
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mx-auto" />
              </div>
            )}

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

        {result && (
          <ResultadosSheetMegaSena
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            jogos={result.jogos}
            ultimoConcursoDezenas={ultimoConcursoDezenas}
            onClearAll={handleClearAll}
            estrategia={result.estrategia}
            periodoAnalise={periodoAnalise}
            dezenasFixes={dezenasFiexas.length > 0 ? dezenasFiexas : undefined}
          />
        )}
      </div>
    </MainLayout>
  );
}
