import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { QuantidadeSelector } from "@/components/gerador/QuantidadeSelector";
import { PeriodoAnaliseSelector } from "@/components/gerador/PeriodoAnaliseSelector";
import { PedidoEspecialInput } from "@/components/gerador/PedidoEspecialInput";
import { FiltroDezenaSelectorDuplaSena } from "@/components/duplasena/FiltroDezenaSelectorDuplaSena";
import { ResultadosSheetDuplaSena } from "@/components/duplasena/ResultadosSheetDuplaSena";
import { useGeradorDuplaSena } from "@/hooks/useGeradorDuplaSena";
import { useGeradorStatus } from "@/hooks/useGeradorStatus";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Dices, Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { UpgradeModal } from "@/components/shared/UpgradeModal";

export default function GeradorDuplaSena() {
  const isMobile = useIsMobile();
  const [quantidade, setQuantidade] = useState(3);
  const [periodoAnalise, setPeriodoAnalise] = useState(50);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [ultimoConcursoDezenas, setUltimoConcursoDezenas] = useState<number[]>([]);
  
  // Filtros
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [dezenasFiexasOpcao, setDezenasFiexasOpcao] = useState<"padrao" | "sim" | "nao">("padrao");
  const [dezenasFixas, setDezenasFixas] = useState<number[]>([]);
  const [dezenasExcluidasOpcao, setDezenasExcluidasOpcao] = useState<"padrao" | "sim" | "nao">("padrao");
  const [dezenasExcluidas, setDezenasExcluidas] = useState<number[]>([]);
  const [pedidoEspecial, setPedidoEspecial] = useState("");
  
  const { isLoading, result, error, generatePalpites, reset } = useGeradorDuplaSena();
  const { remaining_today, max_per_day, isLoading: statusLoading, refetch, isAdmin } = useGeradorStatus();

  const canGenerate = isAdmin || remaining_today > 0;

  // Buscar último concurso
  useEffect(() => {
    const fetchUltimoConcurso = async () => {
      const { data } = await supabase
        .from("resultados_duplasena")
        .select("dezenas_sorteio1, dezenas_sorteio2")
        .order("concurso_id", { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        // Combinar ambos os sorteios para destacar repetidas
        const todasDezenas = [...(data.dezenas_sorteio1 || []), ...(data.dezenas_sorteio2 || [])];
        setUltimoConcursoDezenas([...new Set(todasDezenas)]);
      }
    };
    fetchUltimoConcurso();
  }, []);

  const handleGenerate = () => {
    const filtros = {
      dezenasFiexas: dezenasFiexasOpcao === "sim" ? dezenasFixas : [],
      dezenasExcluidas: dezenasExcluidasOpcao === "sim" ? dezenasExcluidas : [],
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
    setDezenasFiexasOpcao("padrao");
    setDezenasFixas([]);
    setDezenasExcluidasOpcao("padrao");
    setDezenasExcluidas([]);
    setPedidoEspecial("");
  };

  const temFiltrosAtivos = 
    dezenasFiexasOpcao !== "padrao" || 
    dezenasExcluidasOpcao !== "padrao" || 
    pedidoEspecial.trim().length > 0;

  return (
    <MainLayout pageTitle="Gerador Dupla Sena">
      <div className="container-senior py-6 space-y-6 max-w-md mx-auto">
        {!isMobile && (
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Dices className="h-7 w-7 text-duplasena-primary" />
              <h1 className="text-2xl font-bold">Gerador Dupla Sena</h1>
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
                  <span className="px-1.5 py-0.5 text-[10px] bg-duplasena-primary/10 text-duplasena-primary rounded-full">
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

            {/* Filtros Avançados */}
            {filtrosAbertos && (
              <div className="space-y-6 pt-2">
                {/* Dezenas Fixas */}
                <FiltroDezenaSelectorDuplaSena
                  label="Dezenas Fixas"
                  description="Forçar dezenas específicas em todos os jogos"
                  value={dezenasFiexasOpcao}
                  onChange={setDezenasFiexasOpcao}
                  dezenasSelecionadas={dezenasFixas}
                  onDezenasChange={setDezenasFixas}
                  disabled={isLoading || !canGenerate}
                  tipo="fixas"
                  maxDezenas={5}
                />

                {/* Dezenas Excluídas */}
                <FiltroDezenaSelectorDuplaSena
                  label="Dezenas Excluídas"
                  description="Evitar dezenas específicas nos jogos"
                  value={dezenasExcluidasOpcao}
                  onChange={setDezenasExcluidasOpcao}
                  dezenasSelecionadas={dezenasExcluidas}
                  onDezenasChange={setDezenasExcluidas}
                  disabled={isLoading || !canGenerate}
                  tipo="excluidas"
                  maxDezenas={10}
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
              className="w-full h-14 text-lg gap-2 bg-duplasena-primary hover:bg-duplasena-primary/90"
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
          <ResultadosSheetDuplaSena
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            jogos={result.jogos}
            ultimoConcursoDezenas={ultimoConcursoDezenas}
            onClearAll={handleClearAll}
            estrategia={result.estrategia}
            periodoAnalise={periodoAnalise}
            dezenasFixes={dezenasFiexasOpcao === "sim" ? dezenasFixas : undefined}
          />
        )}
      </div>
    </MainLayout>
  );
}
