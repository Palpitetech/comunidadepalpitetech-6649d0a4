import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FiltroPatternSelector } from "@/components/desdobramento/FiltroPatternSelector";
import { GridDesdobramentoDuplaSena } from "@/components/duplasena/desdobramento/GridDesdobramentoDuplaSena";
import { ModoSeletorDesdobramentoDuplaSena } from "@/components/duplasena/desdobramento/ModoSeletorDesdobramentoDuplaSena";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDesdobramentoStatsDuplaSena } from "@/hooks/useDesdobramentoStatsDuplaSena";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { 
  gerarDesdobramentoDuplaSena, 
  estimarCombinacoesValidasDuplaSena,
  FiltrosDesdobramentoDuplaSena 
} from "@/lib/desdobramentoDuplaSena";
import { 
  Shuffle, 
  Loader2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  RotateCcw
} from "lucide-react";
import { DesdobramentoResultadosDuplaSena } from "@/components/duplasena/desdobramento/DesdobramentoResultadosDuplaSena";

export default function DesdobramentoDuplaSena() {
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Estatísticas combinadas de ambos os sorteios (mesmo jogo vale para S1 e S2)
  const { repetidas, impares, primos, moldura, multiplosDe3, isLoading: statsLoading } = useDesdobramentoStatsDuplaSena();
  
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

  // Buscar último sorteio (combinar dezenas de S1 e S2 para referência de repetidas)
  useEffect(() => {
    const fetchUltimoSorteio = async () => {
      const { data } = await (supabase as any)
        .from("resultados_loterias")
        .select("dezenas, dezenas_sorteio2")
        .eq("loteria", "duplasena")
        .order("concurso", { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        const combinadas = [...new Set([
          ...(data.dezenas || []),
          ...(data.dezenas_sorteio2 || [])
        ])];
        setUltimoSorteio(combinadas);
      }
    };
    fetchUltimoSorteio();
  }, []);

  // Handler para toggle de dezena
  const handleToggleDezena = (numero: number) => {
    if (modoGrid === "fixar") {
      // Remover de excluídas se estiver
      if (dezenasExcluidas.includes(numero)) {
        setDezenasExcluidas(prev => prev.filter(d => d !== numero));
      }
      // Toggle em fixas
      setDezenasFixas(prev =>
        prev.includes(numero)
          ? prev.filter(d => d !== numero)
          : prev.length < 5 ? [...prev, numero] : prev
      );
    } else {
      // Remover de fixas se estiver
      if (dezenasFixas.includes(numero)) {
        setDezenasFixas(prev => prev.filter(d => d !== numero));
      }
      // Toggle em excluídas
      setDezenasExcluidas(prev =>
        prev.includes(numero)
          ? prev.filter(d => d !== numero)
          : prev.length < 10 ? [...prev, numero] : prev
      );
    }
  };

  // Montar objeto de filtros
  const filtros: FiltrosDesdobramentoDuplaSena = useMemo(() => ({
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
    const timer = setTimeout(() => {
      const count = estimarCombinacoesValidasDuplaSena(filtros, 500);
      setEstimativa(count);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [filtros]);

  const handleGerar = () => {
    setIsGenerating(true);
    setError(null);
    
    setTimeout(() => {
      try {
        const jogos = gerarDesdobramentoDuplaSena(filtros, qtdPalpites);
        
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
  }), [
    filtroImpares, filtroRepetidas, filtroPrimos, filtroMoldura, filtroM3,
    filtroImparesAtivo, filtroRepetidasAtivo, filtroPrimosAtivo, filtroMolduraAtivo, filtroM3Ativo,
    autoTop3Impares, autoTop3Repetidas, autoTop3Primos, autoTop3Moldura, autoTop3M3
  ]);

  // Se há jogos gerados, mostrar tela fullscreen de resultados
  if (jogosGerados && jogosGerados.length > 0) {
    return (
      <DesdobramentoResultadosDuplaSena
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
      <MainLayout pageTitle="Desdobramento Dupla Sena">
        <div className="container-senior py-6 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="Desdobramento Dupla Sena">
      <div className="container-senior py-4 space-y-5 max-w-lg mx-auto">
        {/* Header desktop */}
        {!isMobile && (
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Shuffle className="h-7 w-7 text-duplasena-primary" />
              <h1 className="text-2xl font-bold">Desdobramento Dupla Sena</h1>
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
        <ModoSeletorDesdobramentoDuplaSena
          modo={modoGrid}
          onModoChange={setModoGrid}
          qtdFixas={dezenasFixas.length}
          qtdExcluidas={dezenasExcluidas.length}
        />

        {/* Grid de dezenas */}
        <GridDesdobramentoDuplaSena
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
                {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((n) => (
                  <DropdownMenuItem key={n} onClick={() => setQtdDezenas(n)}>
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
          className="w-full h-14 text-lg font-semibold bg-duplasena-primary hover:bg-duplasena-primary/90"
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
