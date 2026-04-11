import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
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
import { useGerador } from "@/hooks/useGerador";
import { useGeradorStatus } from "@/hooks/useGeradorStatus";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Dices, Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

export default function Gerador() {
  const isMobile = useIsMobile();
  const [quantidade, setQuantidade] = useState(3);
  const [qtdDezenas, setQtdDezenas] = useState(15);
  const [periodoAnalise, setPeriodoAnalise] = useState(50);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [ultimoConcursoDezenas, setUltimoConcursoDezenas] = useState<number[]>([]);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  
  // Novos estados para filtros
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [dezenasFixasOpcao, setDezenasFixasOpcao] = useState<"padrao" | "sim" | "nao">("padrao");
  const [dezenasFixas, setDezenasFixas] = useState<number[]>([]);
  const [dezenasExcluidasOpcao, setDezenasExcluidasOpcao] = useState<"padrao" | "sim" | "nao">("padrao");
  const [dezenasExcluidas, setDezenasExcluidas] = useState<number[]>([]);
  const [pedidoEspecial, setPedidoEspecial] = useState("");
  
  const { isLoading, result, error, generatePalpites, reset } = useGerador();
  const { remaining_today, max_per_day, isLoading: statusLoading, refetch, isAdmin } = useGeradorStatus();

  const canGenerate = statusLoading || isAdmin || remaining_today > 0;

  // Buscar último concurso para cálculo de repetidas
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

  const handleGenerate = () => {
    if (statusLoading) return;
    if (!canGenerate) {
      setUpgradeOpen(true);
      return;
    }
    
    // Preparar filtros
    const filtros = {
      dezenasFixas: dezenasFixasOpcao === "sim" ? dezenasFixas : [],
      dezenasExcluidas: dezenasExcluidasOpcao === "sim" ? dezenasExcluidas : [],
      pedidoEspecial: pedidoEspecial.trim() || undefined,
    };
    
    generatePalpites(quantidade, qtdDezenas, periodoAnalise, filtros);
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
    setPeriodoAnalise(50);
    setDezenasFixasOpcao("padrao");
    setDezenasFixas([]);
    setDezenasExcluidasOpcao("padrao");
    setDezenasExcluidas([]);
    setPedidoEspecial("");
  };

  const temFiltrosAtivos = 
    dezenasFixasOpcao !== "padrao" || 
    dezenasExcluidasOpcao !== "padrao" || 
    pedidoEspecial.trim().length > 0;

  const usageBadgeText = isAdmin
    ? "∞"
    : `${remaining_today}/${max_per_day}`;

  return (
    <MainLayout pageTitle="Gerador de Palpites">
      <div className="container-senior py-6 space-y-6 max-w-md mx-auto">
        {/* Header desktop com ícone */}
        {!isMobile && (
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Dices className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold">Gerador de Palpites</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Palpites baseados em análise estatística
            </p>
          </div>
        )}

        {/* Card de Configuração */}
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Seletor de Quantidade de Palpites */}
            <QuantidadeSelector
              value={quantidade}
              onChange={setQuantidade}
              max={12}
              disabled={isLoading}
            />

            {/* Seletor de Dezenas por Palpite */}
            <DezenasSelector
              value={qtdDezenas}
              onChange={setQtdDezenas}
              disabled={isLoading}
            />

            {/* Seletor de Período de Análise */}
            <PeriodoAnaliseSelector
              value={periodoAnalise}
              onChange={setPeriodoAnalise}
              disabled={isLoading}
            />

            <Separator />

            {/* Botão para abrir/fechar filtros avançados */}
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

            {/* Filtros Avançados */}
            {filtrosAbertos && (
              <div className="space-y-6 pt-2">
                {/* Dezenas Fixas */}
                <FiltroDezenasSelector
                  label="Dezenas Fixas"
                  description="Forçar dezenas específicas em todos os jogos"
                  value={dezenasFixasOpcao}
                  onChange={setDezenasFixasOpcao}
                  dezenasSelecionadas={dezenasFixas}
                  onDezenasChange={setDezenasFixas}
                  disabled={isLoading}
                  tipo="fixas"
                />

                {/* Dezenas Excluídas */}
                <FiltroDezenasSelector
                  label="Dezenas Excluídas"
                  description="Evitar dezenas específicas nos jogos"
                  value={dezenasExcluidasOpcao}
                  onChange={setDezenasExcluidasOpcao}
                  dezenasSelecionadas={dezenasExcluidas}
                  onDezenasChange={setDezenasExcluidas}
                  disabled={isLoading}
                  tipo="excluidas"
                />

                {/* Pedido Especial */}
                <PedidoEspecialInput
                  value={pedidoEspecial}
                  onChange={setPedidoEspecial}
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Erro */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Botão de Gerar com badge de uso */}
            <div className="relative">
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
              {/* Badge de uso no canto do botão */}
              {!statusLoading && !isLoading && (
                <span className={`absolute -top-2 -right-2 text-[11px] font-bold px-2 py-0.5 rounded-full border shadow-sm ${
                  canGenerate
                    ? "bg-background text-foreground border-border"
                    : "bg-destructive text-destructive-foreground border-destructive"
                }`}>
                  {usageBadgeText} uso{max_per_day !== 1 ? "s" : ""}/dia
                </span>
              )}
            </div>

            {/* Loading skeleton */}
            {isLoading && (
              <div className="space-y-3">
                <div className="text-center text-sm text-muted-foreground">
                  Analisando {periodoAnalise === 1 ? "o último concurso" : `os últimos ${periodoAnalise} concursos`}...
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mx-auto" />
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
            estrategia={result.estrategia}
            periodoAnalise={periodoAnalise}
            dezenasFixas={dezenasFixasOpcao === "sim" ? dezenasFixas : undefined}
          />
        )}

        {/* Modal de Upgrade ao exceder limite */}
        <UpgradeModal
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
          featureLabel="Gerador de Palpites — 10 usos/dia"
          variant="vip"
        />
      </div>
    </MainLayout>
  );
}
