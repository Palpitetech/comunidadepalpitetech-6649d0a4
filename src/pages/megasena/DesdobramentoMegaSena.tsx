import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FiltroPatternSelector } from "@/components/desdobramento/FiltroPatternSelector";
import { GridDesdobramentoMegaSena } from "@/components/megasena/desdobramento/GridDesdobramentoMegaSena";
import { ModoSeletorDesdobramentoMegaSena } from "@/components/megasena/desdobramento/ModoSeletorDesdobramentoMegaSena";
import { FloatingNotes } from "@/components/analise/FloatingNotes";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDesdobramentoStatsMegaSena } from "@/hooks/useDesdobramentoStatsMegaSena";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { 
  gerarDesdobramentoMegaSena, 
  estimarCombinacoesValidas,
  FiltrosDesdobramentoMegaSena 
} from "@/lib/desdobramentoMegaSena";
import { cn } from "@/lib/utils";
import { 
  Shuffle, 
  Loader2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  RotateCcw
} from "lucide-react";
import { DesdobramentoResultadosMegaSena } from "@/components/megasena/desdobramento/DesdobramentoResultadosMegaSena";

export default function DesdobramentoMegaSena() {
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const { repetidas, impares, primos, moldura, multiplosDe3, isLoading: statsLoading } = useDesdobramentoStatsMegaSena();
  
  // Auto top 3 para cada padrão
  const autoTop3Impares = useMemo(() => impares.slice(0, 3).map(i => i.valor), [impares]);
  const autoTop3Repetidas = useMemo(() => repetidas.slice(0, 3).map(r => r.valor), [repetidas]);
  const autoTop3Primos = useMemo(() => primos.slice(0, 3).map(p => p.valor), [primos]);
  const autoTop3Moldura = useMemo(() => moldura.slice(0, 3).map(m => m.valor), [moldura]);
  const autoTop3M3 = useMemo(() => multiplosDe3.slice(0, 3).map(m => m.valor), [multiplosDe3]);
  
  // Estado dos filtros de padrões
  const [filtroImpares, setFiltroImpares] = useState<number[]>([]);
  const [filtroRepetidas, setFiltroRepetidas] = useState<number[]>([]);
  const [filtroPrimos, setFiltroPrimos] = useState<number[]>([]);
  const [filtroMoldura, setFiltroMoldura] = useState<number[]>([]);
  const [filtroM3, setFiltroM3] = useState<number[]>([]);
  
  // Estado de ativação dos filtros
  const [filtroImparesAtivo, setFiltroImparesAtivo] = useState(true);
  const [filtroRepetidasAtivo, setFiltroRepetidasAtivo] = useState(true);
  const [filtroPrimosAtivo, setFiltroPrimosAtivo] = useState(true);
  const [filtroMolduraAtivo, setFiltroMolduraAtivo] = useState(true);
  const [filtroM3Ativo, setFiltroM3Ativo] = useState(true);
  
  // Inicializar filtros quando dados carregarem
  useEffect(() => {
    if (autoTop3Impares.length > 0 && filtroImpares.length === 0) {
      setFiltroImpares(autoTop3Impares);
    }
  }, [autoTop3Impares]);
  
  useEffect(() => {
    if (autoTop3Repetidas.length > 0 && filtroRepetidas.length === 0) {
      setFiltroRepetidas(autoTop3Repetidas);
    }
  }, [autoTop3Repetidas]);
  
  useEffect(() => {
    if (autoTop3Primos.length > 0 && filtroPrimos.length === 0) {
      setFiltroPrimos(autoTop3Primos);
    }
  }, [autoTop3Primos]);
  
  useEffect(() => {
    if (autoTop3Moldura.length > 0 && filtroMoldura.length === 0) {
      setFiltroMoldura(autoTop3Moldura);
    }
  }, [autoTop3Moldura]);

  useEffect(() => {
    if (autoTop3M3.length > 0 && filtroM3.length === 0) {
      setFiltroM3(autoTop3M3);
    }
  }, [autoTop3M3]);
  
  
  // Quantidade de dezenas e palpites
  const [qtdDezenas, setQtdDezenas] = useState(6);
  const [qtdPalpites, setQtdPalpites] = useState(10);
  
  // Estado para último sorteio
  const [ultimoSorteio, setUltimoSorteio] = useState<number[]>([]);
  
  // Estado de geração
  const [isGenerating, setIsGenerating] = useState(false);
  const [jogosGerados, setJogosGerados] = useState<{ dezenas: number[] }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Controle de expansão dos filtros
  const [filtrosPadroesAbertos, setFiltrosPadroesAbertos] = useState(false);
  
  // Estado do grid de dezenas
  const [modoGrid, setModoGrid] = useState<"fixar" | "excluir">("fixar");
  const [dezenasFixas, setDezenasFixas] = useState<number[]>([]);
  const [dezenasExcluidas, setDezenasExcluidas] = useState<number[]>([]);

  // Estado para dados vindos da Análise do Dia (via URL)
  const [filtrosAnalise, setFiltrosAnalise] = useState<{
    impares: number[];
    repetidas: number[];
    moldura: number[];
    primos: number[];
    m3: number[];
  }>({ impares: [], repetidas: [], moldura: [], primos: [], m3: [] });
  const [fixasAnalise, setFixasAnalise] = useState<number[]>([]);
  const [excluidasAnalise, setExcluidasAnalise] = useState<number[]>([]);

  // Processar parâmetros da URL ao carregar
  useEffect(() => {
    const fixasParam = searchParams.get("fixas");
    const excluidasParam = searchParams.get("excluidas");
    const imparesParam = searchParams.get("impares");
    const repetidasParam = searchParams.get("repetidas");
    const molduraParam = searchParams.get("moldura");
    const primosParam = searchParams.get("primos");
    const m3Param = searchParams.get("m3");

    // Parse fixas
    if (fixasParam) {
      const fixas = fixasParam.split(",").map(Number).filter(n => !isNaN(n) && n >= 1 && n <= 60);
      if (fixas.length > 0) {
        setDezenasFixas(fixas);
        setFixasAnalise(fixas);
      }
    }

    // Parse excluidas
    if (excluidasParam) {
      const excluidas = excluidasParam.split(",").map(Number).filter(n => !isNaN(n) && n >= 1 && n <= 60);
      if (excluidas.length > 0) {
        setDezenasExcluidas(excluidas);
        setExcluidasAnalise(excluidas);
      }
    }

    // Parse filtros de padrões
    const newFiltrosAnalise = { impares: [] as number[], repetidas: [] as number[], moldura: [] as number[], primos: [] as number[], m3: [] as number[] };
    
    if (imparesParam) {
      const vals = imparesParam.split(",").map(Number).filter(n => !isNaN(n));
      if (vals.length > 0) {
        newFiltrosAnalise.impares = vals;
        setFiltroImpares(vals);
      }
    }
    if (repetidasParam) {
      const vals = repetidasParam.split(",").map(Number).filter(n => !isNaN(n));
      if (vals.length > 0) {
        newFiltrosAnalise.repetidas = vals;
        setFiltroRepetidas(vals);
      }
    }
    if (molduraParam) {
      const vals = molduraParam.split(",").map(Number).filter(n => !isNaN(n));
      if (vals.length > 0) {
        newFiltrosAnalise.moldura = vals;
        setFiltroMoldura(vals);
      }
    }
    if (primosParam) {
      const vals = primosParam.split(",").map(Number).filter(n => !isNaN(n));
      if (vals.length > 0) {
        newFiltrosAnalise.primos = vals;
        setFiltroPrimos(vals);
      }
    }
    if (m3Param) {
      const vals = m3Param.split(",").map(Number).filter(n => !isNaN(n));
      if (vals.length > 0) {
        newFiltrosAnalise.m3 = vals;
        setFiltroM3(vals);
      }
    }

    if (Object.values(newFiltrosAnalise).some(arr => arr.length > 0)) {
      setFiltrosAnalise(newFiltrosAnalise);
    }
  }, []);

  // Funções para remover dados da Análise
  const handleRemoveFiltrosAnalise = () => {
    setFiltrosAnalise({ impares: [], repetidas: [], moldura: [], primos: [], m3: [] });
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("impares");
    newParams.delete("repetidas");
    newParams.delete("moldura");
    newParams.delete("primos");
    newParams.delete("m3");
    setSearchParams(newParams, { replace: true });
  };

  const handleRemoveFixasAnalise = () => {
    setFixasAnalise([]);
    setDezenasFixas([]);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("fixas");
    setSearchParams(newParams, { replace: true });
  };

  const handleRemoveExcluidasAnalise = () => {
    setExcluidasAnalise([]);
    setDezenasExcluidas([]);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("excluidas");
    setSearchParams(newParams, { replace: true });
  };

  // Calcular total de dados vindos da Análise
  const totalAnalise = Object.values(filtrosAnalise).reduce((acc, arr) => acc + arr.length, 0) + fixasAnalise.length + excluidasAnalise.length;

  // Buscar último sorteio
  useEffect(() => {
    const fetchUltimoSorteio = async () => {
      const { data } = await (supabase as any)
        .from("resultados_loterias")
        .select("dezenas")
        .eq("loteria", "megasena")
        .order("concurso", { ascending: false })
        .limit(1)
        .single();
      
      if (data?.dezenas) {
        setUltimoSorteio(data.dezenas);
      }
    };
    fetchUltimoSorteio();
  }, []);

  // Validação sempre válida (sem filtros de linhas/colunas)
  const filtrosValidos = true;

  // Montar objeto de filtros
  const filtros: FiltrosDesdobramentoMegaSena = useMemo(() => ({
    qtdImpares: filtroImparesAtivo 
      ? (filtroImpares.length > 0 ? filtroImpares : autoTop3Impares) 
      : null,
    qtdRepetidas: filtroRepetidasAtivo 
      ? (filtroRepetidas.length > 0 ? filtroRepetidas : autoTop3Repetidas) 
      : null,
    qtdPrimos: filtroPrimosAtivo 
      ? (filtroPrimos.length > 0 ? filtroPrimos : autoTop3Primos) 
      : null,
    qtdMoldura: filtroMolduraAtivo 
      ? (filtroMoldura.length > 0 ? filtroMoldura : autoTop3Moldura) 
      : null,
    qtdMultiplosDe3: filtroM3Ativo
      ? (filtroM3.length > 0 ? filtroM3 : autoTop3M3)
      : null,
    linhas: null,
    colunas: null,
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

  // Estimar combinações
  const [estimativa, setEstimativa] = useState<number | null>(null);
  
  useEffect(() => {
    if (!filtrosValidos) {
      setEstimativa(null);
      return;
    }
    
    const timer = setTimeout(() => {
      const count = estimarCombinacoesValidas(filtros, 500);
      setEstimativa(count);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [filtros, filtrosValidos]);

  const handleGerar = () => {
    if (!filtrosValidos) return;
    
    setIsGenerating(true);
    setError(null);
    
    setTimeout(() => {
      try {
        const jogos = gerarDesdobramentoMegaSena(filtros, qtdPalpites);
        
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
    setQtdDezenas(6);
    setFiltroImpares(autoTop3Impares);
    setFiltroRepetidas(autoTop3Repetidas);
    setFiltroPrimos(autoTop3Primos);
    setFiltroMoldura(autoTop3Moldura);
    setFiltroM3(autoTop3M3);
  };

  // Preparar dados de filtros para exibição nos resultados
  const filtrosResumo = useMemo(() => ({
    impares: filtroImparesAtivo ? (filtroImpares.length > 0 ? filtroImpares : autoTop3Impares) : null,
    imparesEhPadrao: filtroImparesAtivo && (filtroImpares.length === 0 || 
      (filtroImpares.length === autoTop3Impares.length && 
       filtroImpares.every(v => autoTop3Impares.includes(v)))),
    repetidas: filtroRepetidasAtivo ? (filtroRepetidas.length > 0 ? filtroRepetidas : autoTop3Repetidas) : null,
    repetidasEhPadrao: filtroRepetidasAtivo && (filtroRepetidas.length === 0 || 
      (filtroRepetidas.length === autoTop3Repetidas.length && 
       filtroRepetidas.every(v => autoTop3Repetidas.includes(v)))),
    primos: filtroPrimosAtivo ? (filtroPrimos.length > 0 ? filtroPrimos : autoTop3Primos) : null,
    primosEhPadrao: filtroPrimosAtivo && (filtroPrimos.length === 0 || 
      (filtroPrimos.length === autoTop3Primos.length && 
       filtroPrimos.every(v => autoTop3Primos.includes(v)))),
    moldura: filtroMolduraAtivo ? (filtroMoldura.length > 0 ? filtroMoldura : autoTop3Moldura) : null,
    molduraEhPadrao: filtroMolduraAtivo && (filtroMoldura.length === 0 || 
      (filtroMoldura.length === autoTop3Moldura.length && 
       filtroMoldura.every(v => autoTop3Moldura.includes(v)))),
    multiplosDe3: filtroM3Ativo ? (filtroM3.length > 0 ? filtroM3 : autoTop3M3) : null,
    m3EhPadrao: filtroM3Ativo && (filtroM3.length === 0 || 
      (filtroM3.length === autoTop3M3.length && 
       filtroM3.every(v => autoTop3M3.includes(v)))),
    linhas: null,
    colunas: null,
  }), [
    filtroImpares, filtroRepetidas, filtroPrimos, filtroMoldura, filtroM3,
    filtroImparesAtivo, filtroRepetidasAtivo, filtroPrimosAtivo, filtroMolduraAtivo, filtroM3Ativo,
    autoTop3Impares, autoTop3Repetidas, autoTop3Primos, autoTop3Moldura, autoTop3M3
  ]);

  // Se há jogos gerados, mostrar tela fullscreen de resultados
  if (jogosGerados && jogosGerados.length > 0) {
    return (
      <DesdobramentoResultadosMegaSena
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
      <MainLayout pageTitle="Desdobramento Mega Sena">
        <div className="container-senior py-6 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="Desdobramento Mega Sena">
      <div className="container-senior py-4 space-y-5 max-w-lg mx-auto">
        {/* Header desktop */}
        {!isMobile && (
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Shuffle className="h-7 w-7 text-megasena-primary" />
              <h1 className="text-2xl font-bold">Desdobramento Mega Sena</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Gere palpites com filtros estatísticos personalizados
            </p>
          </div>
        )}

        {/* Botão para abrir filtros de jogos */}
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
          {filtrosPadroesAbertos ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {/* Seletores de padrões */}
        {filtrosPadroesAbertos && (
          <Card>
            <CardContent className="pt-4 pb-2">
              {/* Botões de ação global */}
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

              {/* Lista de filtros */}
              <div className="divide-y">
                <FiltroPatternSelector
                  label="Ímpares"
                  opcoes={impares}
                  valoresSelecionados={filtroImpares}
                  onChange={setFiltroImpares}
                  autoTop3={autoTop3Impares}
                  disabled={!filtroImparesAtivo}
                  onDisabledChange={setFiltroImparesAtivo}
                />
                <FiltroPatternSelector
                  label="Primos"
                  opcoes={primos}
                  valoresSelecionados={filtroPrimos}
                  onChange={setFiltroPrimos}
                  autoTop3={autoTop3Primos}
                  disabled={!filtroPrimosAtivo}
                  onDisabledChange={setFiltroPrimosAtivo}
                />
                <FiltroPatternSelector
                  label="Repetidas"
                  opcoes={repetidas}
                  valoresSelecionados={filtroRepetidas}
                  onChange={setFiltroRepetidas}
                  autoTop3={autoTop3Repetidas}
                  disabled={!filtroRepetidasAtivo}
                  onDisabledChange={setFiltroRepetidasAtivo}
                />
                <FiltroPatternSelector
                  label="Moldura"
                  opcoes={moldura}
                  valoresSelecionados={filtroMoldura}
                  onChange={setFiltroMoldura}
                  autoTop3={autoTop3Moldura}
                  disabled={!filtroMolduraAtivo}
                  onDisabledChange={setFiltroMolduraAtivo}
                />
                <FiltroPatternSelector
                  label="Múltiplos de 3"
                  opcoes={multiplosDe3}
                  valoresSelecionados={filtroM3}
                  onChange={setFiltroM3}
                  autoTop3={autoTop3M3}
                  disabled={!filtroM3Ativo}
                  onDisabledChange={setFiltroM3Ativo}
                />
              </div>
            </CardContent>
          </Card>
        )}


        {/* Erro de geração */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Controles de Quantidade */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Gerar</span>
            <input
              type="text"
              inputMode="numeric"
              value={qtdPalpites}
              onChange={(e) => {
                const val = parseInt(e.target.value.replace(/\D/g, ""), 10);
                if (!isNaN(val) && val >= 1 && val <= 100) {
                  setQtdPalpites(val);
                } else if (e.target.value === "") {
                  setQtdPalpites(1);
                }
              }}
              onBlur={(e) => {
                const val = parseInt(e.target.value, 10);
                if (isNaN(val) || val < 1) setQtdPalpites(1);
                else if (val > 100) setQtdPalpites(100);
              }}
              className="w-16 h-10 bg-background text-center text-base font-semibold rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-megasena-primary/20 focus:border-megasena-primary"
            />
            <span className="text-sm text-muted-foreground">palpites de</span>
          </div>

          {/* Dropdown de quantidade de dezenas */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 px-3 gap-1.5 font-semibold"
              >
                {qtdDezenas}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="min-w-[100px] bg-background border shadow-lg z-50"
            >
              {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((num) => (
                <DropdownMenuItem
                  key={num}
                  onClick={() => setQtdDezenas(num)}
                  className={cn(
                    "justify-center text-sm font-medium cursor-pointer",
                    qtdDezenas === num && "bg-megasena-primary/10 text-megasena-primary"
                  )}
                >
                  {num} dezenas
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Grid de Dezenas */}
        <div className="space-y-3">
          <ModoSeletorDesdobramentoMegaSena modo={modoGrid} onChange={setModoGrid} />
          <GridDesdobramentoMegaSena
            selecionadas={[]}
            fixas={dezenasFixas}
            excluidas={dezenasExcluidas}
            repetidas={ultimoSorteio}
            modo={modoGrid}
            onToggle={(numero) => {
              if (modoGrid === "fixar") {
                if (dezenasExcluidas.includes(numero)) {
                  setDezenasExcluidas(prev => prev.filter(d => d !== numero));
                }
                if (dezenasFixas.includes(numero)) {
                  setDezenasFixas(prev => prev.filter(d => d !== numero));
                } else {
                  setDezenasFixas(prev => [...prev, numero].sort((a, b) => a - b));
                }
              } else if (modoGrid === "excluir") {
                if (dezenasFixas.includes(numero)) {
                  setDezenasFixas(prev => prev.filter(d => d !== numero));
                }
                if (dezenasExcluidas.includes(numero)) {
                  setDezenasExcluidas(prev => prev.filter(d => d !== numero));
                } else {
                  setDezenasExcluidas(prev => [...prev, numero].sort((a, b) => a - b));
                }
              }
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Fixas: {dezenasFixas.length} | Excluídas: {dezenasExcluidas.length}</span>
            {(dezenasFixas.length > 0 || dezenasExcluidas.length > 0) && (
              <button 
                type="button"
                onClick={() => { setDezenasFixas([]); setDezenasExcluidas([]); }}
                className="text-destructive hover:underline"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2">
          <Button
            onClick={handleGerar}
            disabled={isGenerating || !filtrosValidos || estimativa === 0}
            className="flex-1 h-14 text-lg gap-2 bg-megasena-primary hover:bg-megasena-primary/90"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Shuffle className="h-5 w-5" />
                Gerar Palpites
              </>
            )}
          </Button>
          
          {jogosGerados && (
            <Button
              variant="outline"
              onClick={handleLimpar}
              className="h-14"
              size="lg"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          )}
        </div>

      </div>

      {/* FloatingNotes - dados da Análise do Dia */}
      {totalAnalise > 0 && (
        <FloatingNotes 
          selectedFilters={filtrosAnalise}
          selectedFixas={fixasAnalise}
          selectedExcluidas={excluidasAnalise}
          onRemoveFiltros={handleRemoveFiltrosAnalise}
          onRemoveFixas={handleRemoveFixasAnalise}
          onRemoveExcluidas={handleRemoveExcluidasAnalise}
        />
      )}
    </MainLayout>
  );
}
