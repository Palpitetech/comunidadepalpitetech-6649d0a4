import { useState, useEffect } from "react";
...
import { useUpsell } from "@/contexts/UpsellContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Dices, Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

export default function GeradorDuplaSena() {
...
  const { remaining_today, max_per_day, isLoading: statusLoading, refetch, isAdmin } = useGeradorStatus();
  const { isPremium } = useUserRole();

  const canGenerate = !statusLoading && remaining_today > 0;

  // Buscar último concurso
  useEffect(() => {
    const fetchUltimoConcurso = async () => {
      const { data } = await (supabase as any)
        .from("resultados_loterias")
        .select("dezenas, dezenas_sorteio2")
        .eq("loteria", "duplasena")
        .order("concurso", { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        const todasDezenas = [...(data.dezenas || []), ...(data.dezenas_sorteio2 || [])];
        setUltimoConcursoDezenas([...new Set(todasDezenas)]);
      }
    };
    fetchUltimoConcurso();
  }, []);

  const handleGenerate = () => {
    if (!isPremium && !isAdmin) {
      openUpgradeModal("Gerador de Palpites");
      return;
    }
    if (statusLoading) return;
    if (!canGenerate && !isAdmin) {
      openUpgradeModal("Gerador de Palpites");
      return;
    }
    const filtros = {
      dezenasFiexas: dezenasFiexasOpcao === "sim" ? dezenasFixas : [],
      dezenasExcluidas: dezenasExcluidasOpcao === "sim" ? dezenasExcluidas : [],
      pedidoEspecial: pedidoEspecial.trim() || undefined,
    };
    generatePalpites(quantidade, periodoAnalise, filtros);
  };

  const usageBadgeText = isAdmin ? "∞" : `${remaining_today}/${max_per_day}`;

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

            <div className="relative">
              <Button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full h-14 text-lg gap-2 bg-duplasena-primary hover:bg-duplasena-primary/90"
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

        {/* O UpgradeModal agora é gerenciado globalmente pelo UpsellProvider */}
      </div>
    </MainLayout>
  );
}
