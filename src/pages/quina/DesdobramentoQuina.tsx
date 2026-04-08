import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FiltroPatternSelector } from "@/components/desdobramento/FiltroPatternSelector";
import { GridDesdobramentoQuina } from "@/components/quina/desdobramento/GridDesdobramentoQuina";
import { ModoSeletorDesdobramentoQuina } from "@/components/quina/desdobramento/ModoSeletorDesdobramentoQuina";
import { DesdobramentoResultadosQuina } from "@/components/quina/desdobramento/DesdobramentoResultadosQuina";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDesdobramentoStatsQuina } from "@/hooks/useDesdobramentoStatsQuina";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { 
  gerarDesdobramentoQuina, 
  estimarCombinacoesValidasQuina,
  FiltrosDesdobramentoQuina 
} from "@/lib/desdobramentoQuina";
import { 
  Shuffle, 
  Loader2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
} from "lucide-react";

export default function DesdobramentoQuina() {
  const isMobile = useIsMobile();
  const { repetidas, impares, primos, moldura, multiplosDe3, isLoading: statsLoading } = useDesdobramentoStatsQuina();
  
  const autoTop3Impares = useMemo(() => impares.slice(0, 3).map(i => i.valor), [impares]);
  const autoTop3Repetidas = useMemo(() => repetidas.slice(0, 3).map(r => r.valor), [repetidas]);
  const autoTop3Primos = useMemo(() => primos.slice(0, 3).map(p => p.valor), [primos]);
  const autoTop3Moldura = useMemo(() => moldura.slice(0, 3).map(m => m.valor), [moldura]);
  const autoTop3M3 = useMemo(() => multiplosDe3.slice(0, 3).map(m => m.valor), [multiplosDe3]);
  
  const [filtroImpares, setFiltroImpares] = useState<number[]>([]);
  const [filtroRepetidas, setFiltroRepetidas] = useState<number[]>([]);
  const [filtroPrimos, setFiltroPrimos] = useState<number[]>([]);
  const [filtroMoldura, setFiltroMoldura] = useState<number[]>([]);
  const [filtroM3, setFiltroM3] = useState<number[]>([]);
  
  const [filtroImparesAtivo, setFiltroImparesAtivo] = useState(true);
  const [filtroRepetidasAtivo, setFiltroRepetidasAtivo] = useState(true);
  const [filtroPrimosAtivo, setFiltroPrimosAtivo] = useState(true);
  const [filtroMolduraAtivo, setFiltroMolduraAtivo] = useState(true);
  const [filtroM3Ativo, setFiltroM3Ativo] = useState(true);
  
  useEffect(() => { if (autoTop3Impares.length > 0 && filtroImpares.length === 0) setFiltroImpares(autoTop3Impares); }, [autoTop3Impares]);
  useEffect(() => { if (autoTop3Repetidas.length > 0 && filtroRepetidas.length === 0) setFiltroRepetidas(autoTop3Repetidas); }, [autoTop3Repetidas]);
  useEffect(() => { if (autoTop3Primos.length > 0 && filtroPrimos.length === 0) setFiltroPrimos(autoTop3Primos); }, [autoTop3Primos]);
  useEffect(() => { if (autoTop3Moldura.length > 0 && filtroMoldura.length === 0) setFiltroMoldura(autoTop3Moldura); }, [autoTop3Moldura]);
  useEffect(() => { if (autoTop3M3.length > 0 && filtroM3.length === 0) setFiltroM3(autoTop3M3); }, [autoTop3M3]);
  
  const [qtdDezenas, setQtdDezenas] = useState(5);
  const [qtdPalpites, setQtdPalpites] = useState(10);
  const [ultimoSorteio, setUltimoSorteio] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [jogosGerados, setJogosGerados] = useState<{ dezenas: number[] }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtrosPadroesAbertos, setFiltrosPadroesAbertos] = useState(false);
  const [modoGrid, setModoGrid] = useState<"fixar" | "excluir">("fixar");
  const [dezenasFixas, setDezenasFixas] = useState<number[]>([]);
  const [dezenasExcluidas, setDezenasExcluidas] = useState<number[]>([]);

  useEffect(() => {
    const fetchUltimoSorteio = async () => {
      const { data } = await (supabase as any)
        .from("resultados_loterias")
        .select("dezenas")
        .eq("loteria", "quina")
        .order("concurso", { ascending: false })
        .limit(1)
        .single();
      
      if (data?.dezenas) {
        setUltimoSorteio(data.dezenas);
      }
    };
    fetchUltimoSorteio();
  }, []);

  const handleToggleDezena = (numero: number) => {
    if (modoGrid === "fixar") {
      if (dezenasExcluidas.includes(numero)) {
        setDezenasExcluidas(prev => prev.filter(d => d !== numero));
      }
      setDezenasFixas(prev =>
        prev.includes(numero)
          ? prev.filter(d => d !== numero)
          : prev.length < qtdDezenas - 1 ? [...prev, numero] : prev
      );
    } else {
      if (dezenasFixas.includes(numero)) {
        setDezenasFixas(prev => prev.filter(d => d !== numero));
      }
      setDezenasExcluidas(prev =>
        prev.includes(numero)
          ? prev.filter(d => d !== numero)
          : prev.length < 20 ? [...prev, numero] : prev
      );
    }
  };

  const filtros: FiltrosDesdobramentoQuina = useMemo(() => ({
    qtdImpares: filtroImparesAtivo ? (filtroImpares.length > 0 ? filtroImpares : autoTop3Impares) : null,
    qtdRepetidas: filtroRepetidasAtivo ? (filtroRepetidas.length > 0 ? filtroRepetidas : autoTop3Repetidas) : null,
    qtdPrimos: filtroPrimosAtivo ? (filtroPrimos.length > 0 ? filtroPrimos : autoTop3Primos) : null,
    qtdMoldura: filtroMolduraAtivo ? (filtroMoldura.length > 0 ? filtroMoldura : autoTop3Moldura) : null,
    qtdMultiplosDe3: filtroM3Ativo ? (filtroM3.length > 0 ? filtroM3 : autoTop3M3) : null,
    qtdDezenas,
    dezenasUltimoSorteio: ultimoSorteio,
    dezenasFixas,
    dezenasExcluidas,
  }), [
    filtroImpares, filtroRepetidas, filtroPrimos, filtroMoldura, filtroM3,
    filtroImparesAtivo, filtroRepetidasAtivo, filtroPrimosAtivo, filtroMolduraAtivo, filtroM3Ativo,
    autoTop3Impares, autoTop3Repetidas, autoTop3Primos, autoTop3Moldura, autoTop3M3,
    qtdDezenas, ultimoSorteio, dezenasFixas, dezenasExcluidas
  ]);

  const [estimativa, setEstimativa] = useState<number | null>(null);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      const count = estimarCombinacoesValidasQuina(filtros, 500);
      setEstimativa(count);
    }, 500);
    return () => clearTimeout(timer);
  }, [filtros]);

  const handleGerar = () => {
    setIsGenerating(true);
    setError(null);
    
    setTimeout(() => {
      try {
        const jogos = gerarDesdobramentoQuina(filtros, qtdPalpites);
        if (jogos.length === 0) {
          setError("Nenhuma combinação encontrada com esses filtros. Tente ajustar os parâmetros.");
          setJogosGerados(null);
        } else {
          setJogosGerados(jogos);
        }
      } catch (err) {
        setError("Erro ao gerar palpites. Tente novamente.");
      } finally {
        setIsGenerating(false);
      }
    }, 100);
  };

  const handleLimpar = () => {
    setJogosGerados(null);
    setError(null);
    setDezenasFixas([]);
    setDezenasExcluidas([]);
    setQtdDezenas(5);
    setFiltroImpares(autoTop3Impares);
    setFiltroRepetidas(autoTop3Repetidas);
    setFiltroPrimos(autoTop3Primos);
    setFiltroMoldura(autoTop3Moldura);
    setFiltroM3(autoTop3M3);
  };

  const filtrosResumo = useMemo(() => ({
    impares: filtroImparesAtivo ? (filtroImpares.length > 0 ? filtroImpares : autoTop3Impares) : null,
    imparesEhPadrao: filtroImparesAtivo && (filtroImpares.length === 0 || (filtroImpares.length === autoTop3Impares.length && filtroImpares.every(v => autoTop3Impares.includes(v)))),
    repetidas: filtroRepetidasAtivo ? (filtroRepetidas.length > 0 ? filtroRepetidas : autoTop3Repetidas) : null,
    repetidasEhPadrao: filtroRepetidasAtivo && (filtroRepetidas.length === 0 || (filtroRepetidas.length === autoTop3Repetidas.length && filtroRepetidas.every(v => autoTop3Repetidas.includes(v)))),
    primos: filtroPrimosAtivo ? (filtroPrimos.length > 0 ? filtroPrimos : autoTop3Primos) : null,
    primosEhPadrao: filtroPrimosAtivo && (filtroPrimos.length === 0 || (filtroPrimos.length === autoTop3Primos.length && filtroPrimos.every(v => autoTop3Primos.includes(v)))),
    moldura: filtroMolduraAtivo ? (filtroMoldura.length > 0 ? filtroMoldura : autoTop3Moldura) : null,
    molduraEhPadrao: filtroMolduraAtivo && (filtroMoldura.length === 0 || (filtroMoldura.length === autoTop3Moldura.length && filtroMoldura.every(v => autoTop3Moldura.includes(v)))),
    multiplosDe3: filtroM3Ativo ? (filtroM3.length > 0 ? filtroM3 : autoTop3M3) : null,
    m3EhPadrao: filtroM3Ativo && (filtroM3.length === 0 || (filtroM3.length === autoTop3M3.length && filtroM3.every(v => autoTop3M3.includes(v)))),
  }), [
    filtroImpares, filtroRepetidas, filtroPrimos, filtroMoldura, filtroM3,
    filtroImparesAtivo, filtroRepetidasAtivo, filtroPrimosAtivo, filtroMolduraAtivo, filtroM3Ativo,
    autoTop3Impares, autoTop3Repetidas, autoTop3Primos, autoTop3Moldura, autoTop3M3
  ]);

  if (jogosGerados && jogosGerados.length > 0) {
    return (
      <DesdobramentoResultadosQuina
        jogos={jogosGerados}
        dezenasFixes={dezenasFixas}
        ultimoConcursoDezenas={ultimoSorteio}
        qtdDezenas={qtdDezenas}
        onVoltar={handleLimpar}
        filtrosResumo={filtrosResumo}
      />
    );
  }

  if (statsLoading) {
    return (
      <MainLayout pageTitle="Desdobramento Quina">
        <div className="container-senior py-6 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="Desdobramento Quina">
      <div className="container-senior py-4 space-y-5 max-w-lg mx-auto">
        {!isMobile && (
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Shuffle className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold">Desdobramento Quina</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Gere palpites com filtros estatísticos • 5 dezenas de 01 a 80
            </p>
          </div>
        )}

        {/* Filtros de Jogos */}
        <button
          type="button"
          onClick={() => setFiltrosPadroesAbertos(!filtrosPadroesAbertos)}
          className="w-full flex items-center justify-between py-3 px-4 text-sm font-medium bg-card border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>
            </svg>
            Filtros de Jogos
          </span>
          {filtrosPadroesAbertos ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {filtrosPadroesAbertos && (
          <Card>
            <CardContent className="pt-4 pb-2">
              <div className="space-y-2 mb-4">
                <Button
                  variant="outline"
                  className="w-full h-10"
                  onClick={() => {
                    setFiltroImparesAtivo(false);
                    setFiltroRepetidasAtivo(false);
                    setFiltroPrimosAtivo(false);
                    setFiltroMolduraAtivo(false);
                    setFiltroM3Ativo(false);
                  }}
                >
                  Desabilitar Todos
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-10"
                  onClick={() => {
                    setFiltroImparesAtivo(true);
                    setFiltroRepetidasAtivo(true);
                    setFiltroPrimosAtivo(true);
                    setFiltroMolduraAtivo(true);
                    setFiltroM3Ativo(true);
                    setFiltroImpares(autoTop3Impares);
                    setFiltroRepetidas(autoTop3Repetidas);
                    setFiltroPrimos(autoTop3Primos);
                    setFiltroMoldura(autoTop3Moldura);
                    setFiltroM3(autoTop3M3);
                  }}
                >
                  Habilitar c/ Ref.
                </Button>
              </div>

              <div className="divide-y">
                <FiltroPatternSelector
                  label="Ímpares"
                  opcoes={impares}
                  valoresSelecionados={filtroImpares}
                  onChange={setFiltroImpares}
                  autoTop3={autoTop3Impares}
                  disabled={!filtroImparesAtivo}
                  onDisabledChange={(enabled) => setFiltroImparesAtivo(enabled)}
                />
                <FiltroPatternSelector
                  label="Repetidas"
                  opcoes={repetidas}
                  valoresSelecionados={filtroRepetidas}
                  onChange={setFiltroRepetidas}
                  autoTop3={autoTop3Repetidas}
                  disabled={!filtroRepetidasAtivo}
                  onDisabledChange={(enabled) => setFiltroRepetidasAtivo(enabled)}
                />
                <FiltroPatternSelector
                  label="Primos"
                  opcoes={primos}
                  valoresSelecionados={filtroPrimos}
                  onChange={setFiltroPrimos}
                  autoTop3={autoTop3Primos}
                  disabled={!filtroPrimosAtivo}
                  onDisabledChange={(enabled) => setFiltroPrimosAtivo(enabled)}
                />
                <FiltroPatternSelector
                  label="Moldura"
                  opcoes={moldura}
                  valoresSelecionados={filtroMoldura}
                  onChange={setFiltroMoldura}
                  autoTop3={autoTop3Moldura}
                  disabled={!filtroMolduraAtivo}
                  onDisabledChange={(enabled) => setFiltroMolduraAtivo(enabled)}
                />
                <FiltroPatternSelector
                  label="Múlt. 3"
                  opcoes={multiplosDe3}
                  valoresSelecionados={filtroM3}
                  onChange={setFiltroM3}
                  autoTop3={autoTop3M3}
                  disabled={!filtroM3Ativo}
                  onDisabledChange={(enabled) => setFiltroM3Ativo(enabled)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Seletor de modo */}
        <ModoSeletorDesdobramentoQuina
          modo={modoGrid}
          onModoChange={setModoGrid}
          qtdFixas={dezenasFixas.length}
          qtdExcluidas={dezenasExcluidas.length}
        />

        {/* Grid de dezenas 8x10 */}
        <GridDesdobramentoQuina
          selecionadas={[]}
          fixas={dezenasFixas}
          excluidas={dezenasExcluidas}
          repetidas={ultimoSorteio}
          modo={modoGrid}
          onToggle={handleToggleDezena}
        />

        {/* Controles de quantidade */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Quantidade</label>
            <input
              type="number"
              min={1}
              max={250}
              value={qtdPalpites}
              onChange={(e) => setQtdPalpites(Math.min(250, Math.max(1, Number(e.target.value))))}
              className="w-full h-10 px-3 bg-background border rounded-lg text-center font-medium"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Dezenas/jogo</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full h-10 justify-between">
                  {qtdDezenas}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((n) => (
                  <DropdownMenuItem key={n} onClick={() => {
                    setQtdDezenas(n);
                    if (dezenasFixas.length >= n) {
                      setDezenasFixas(dezenasFixas.slice(0, n - 1));
                    }
                  }}>
                    {n} dezenas
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Estimativa */}
        {estimativa !== null && (
          <div className="text-center text-sm text-muted-foreground">
            Taxa de validação: ~{Math.round((estimativa / 500) * 100)}%
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Botão gerar */}
        <Button
          size="lg"
          className="w-full h-14 text-lg font-semibold"
          onClick={handleGerar}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Shuffle className="h-5 w-5 mr-2" />
              Gerar Palpites
            </>
          )}
        </Button>
      </div>
    </MainLayout>
  );
}
