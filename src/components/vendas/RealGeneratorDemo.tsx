import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { QuantidadeSelector } from "@/components/gerador/QuantidadeSelector";
import { DezenasSelector } from "@/components/gerador/DezenasSelector";
import { PeriodoAnaliseSelector } from "@/components/gerador/PeriodoAnaliseSelector";
import { FiltroDezenasSelector } from "@/components/gerador/FiltroDezenasSelector";
import { PedidoEspecialInput } from "@/components/gerador/PedidoEspecialInput";
import { ResultadosSheet } from "@/components/gerador/ResultadosSheet";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import { supabase } from "@/integrations/supabase/client";
import { Dices, Loader2, AlertCircle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function RealGeneratorDemo() {
  const [quantidade, setQuantidade] = useState(3);
  const [qtdDezenas, setQtdDezenas] = useState(15);
  const [periodoAnalise, setPeriodoAnalise] = useState(50);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [ultimoConcursoDezenas, setUltimoConcursoDezenas] = useState<number[]>([]);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [dezenasFiexasOpcao, setDezenasFiexasOpcao] = useState<"padrao" | "sim" | "nao">("padrao");
  const [dezenasFixas, setDezenasFixas] = useState<number[]>([]);
  const [dezenasExcluidasOpcao, setDezenasExcluidasOpcao] = useState<"padrao" | "sim" | "nao">("padrao");
  const [dezenasExcluidas, setDezenasExcluidas] = useState<number[]>([]);
  const [pedidoEspecial, setPedidoEspecial] = useState("");

  useEffect(() => {
    const fetchUltimoConcurso = async () => {
      const { data } = await (supabase as any)
        .from("resultados_loterias")
        .select("dezenas")
        .eq("loteria", "lotofacil")
        .order("concurso", { ascending: false })
        .limit(1)
        .single();
      
      if (data?.dezenas) {
        setUltimoConcursoDezenas(data.dezenas);
      }
    };
    fetchUltimoConcurso();
  }, []);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-palpites`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-is-demo": "true",
          },
          body: JSON.stringify({ 
            quantidade, 
            qtdDezenas, 
            periodoAnalise,
            dezenasFiexas: dezenasFiexasOpcao === "sim" ? dezenasFixas : [],
            dezenasExcluidas: dezenasExcluidasOpcao === "sim" ? dezenasExcluidas : [],
            pedidoEspecial: pedidoEspecial.trim() || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setUpgradeOpen(true);
          throw new Error(data.error || "Limite demonstrativo atingido.");
        }
        throw new Error(data.error || "Erro ao gerar palpites");
      }

      setResult(data);
      setSheetOpen(true);
      toast({
        title: "Palpites gerados! 🎲",
        description: `Modo demonstrativo: ${data.jogos.length} jogo(s) criado(s).`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = () => {
    setResult(null);
    setQuantidade(3);
    setQtdDezenas(15);
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
    <div className="w-full max-w-md mx-auto space-y-4">
      <Card className="border-2 border-primary/20 shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="bg-primary text-primary-foreground py-3 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Sparkles className="h-4 w-4 text-accent" />
            GERADOR REAL (DEMO)
          </div>
          <div className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-full border border-white/20">
            MODO ATIVO
          </div>
        </div>
        <CardContent className="pt-6 space-y-6">
          <QuantidadeSelector
            value={quantidade}
            onChange={setQuantidade}
            max={3}
            disabled={isLoading}
          />

          <DezenasSelector
            value={qtdDezenas}
            onChange={setQtdDezenas}
            disabled={isLoading}
          />

          <PeriodoAnaliseSelector
            value={periodoAnalise}
            onChange={setPeriodoAnalise}
            disabled={isLoading}
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
                <span className="px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary rounded-full">
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
            <div className="space-y-6 pt-2">
              <FiltroDezenasSelector
                label="Dezenas Fixas"
                description="Forçar dezenas específicas"
                value={dezenasFiexasOpcao}
                onChange={setDezenasFiexasOpcao}
                dezenasSelecionadas={dezenasFixas}
                onDezenasChange={setDezenasFixas}
                disabled={isLoading}
                tipo="fixas"
              />

              <FiltroDezenasSelector
                label="Dezenas Excluídas"
                description="Evitar dezenas específicas"
                value={dezenasExcluidasOpcao}
                onChange={setDezenasExcluidasOpcao}
                dezenasSelecionadas={dezenasExcluidas}
                onDezenasChange={setDezenasExcluidas}
                disabled={isLoading}
                tipo="excluidas"
              />

              <PedidoEspecialInput
                value={pedidoEspecial}
                onChange={setPedidoEspecial}
                disabled={isLoading}
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-xs">{error}</p>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full h-14 text-lg gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
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
                Gerar Palpites Agora
              </>
            )}
          </Button>

          {isLoading && (
            <div className="space-y-3">
              <div className="text-center text-xs text-muted-foreground">
                Processando estatísticas reais...
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <ResultadosSheet
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

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        featureLabel="Gerador Completo"
        variant="vip"
      />
    </div>
  );
}
