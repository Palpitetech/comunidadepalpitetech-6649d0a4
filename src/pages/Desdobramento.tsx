import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FiltroPatternSelector } from "@/components/desdobramento/FiltroPatternSelector";
import { FiltroLinhasColunas } from "@/components/desdobramento/FiltroLinhasColunas";
import { GridDesdobramento } from "@/components/desdobramento/GridDesdobramento";
import { ModoSeletorDesdobramento } from "@/components/desdobramento/ModoSeletorDesdobramento";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDesdobramentoStats } from "@/hooks/useDesdobramentoStats";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { 
  gerarDesdobramento, 
  contarCombinacoes,
  FiltrosDesdobramento 
} from "@/lib/desdobramento";
import { formatarDezena } from "@/lib/lotofacil";
import { DezenaCirculoMini } from "@/components/lotofacil/DezenaCirculoMini";
import { cn } from "@/lib/utils";
import { 
  Shuffle, 
  Loader2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  RotateCcw,
  Info
} from "lucide-react";

export default function Desdobramento() {
  const isMobile = useIsMobile();
  const { repetidas, impares, primos, moldura, isLoading: statsLoading } = useDesdobramentoStats();
  
  // Estado dos filtros de padrões
  const [qtdImpares, setQtdImpares] = useState(8);
  const [qtdRepetidas, setQtdRepetidas] = useState(7);
  const [qtdPrimos, setQtdPrimos] = useState(5);
  const [qtdMoldura, setQtdMoldura] = useState(10);
  
  // Estado dos filtros de linhas e colunas
  const [linhas, setLinhas] = useState([3, 3, 3, 3, 3]);
  const [colunas, setColunas] = useState([3, 3, 3, 3, 3]);
  
  // Quantidade de dezenas e palpites
  const [qtdDezenas, setQtdDezenas] = useState(15);
  const [qtdPalpites, setQtdPalpites] = useState(10);
  
  // Estado para último sorteio (repetidas)
  const [ultimoSorteio, setUltimoSorteio] = useState<number[]>([]);
  
  // Estado de geração
  const [isGenerating, setIsGenerating] = useState(false);
  const [jogosGerados, setJogosGerados] = useState<{ dezenas: number[] }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Controle de expansão dos filtros
  const [filtrosPadroesAbertos, setFiltrosPadroesAbertos] = useState(false);
  const [filtrosAvancadosAbertos, setFiltrosAvancadosAbertos] = useState(false);
  const [gridAberto, setGridAberto] = useState(false);
  
  // Estado do grid de dezenas
  const [modoGrid, setModoGrid] = useState<"fixar" | "excluir">("fixar");
  const [dezenasFixas, setDezenasFixas] = useState<number[]>([]);
  const [dezenasExcluidas, setDezenasExcluidas] = useState<number[]>([]);

  // Buscar último sorteio
  useEffect(() => {
    const fetchUltimoSorteio = async () => {
      const { data } = await supabase
        .from("resultados")
        .select("dezenas")
        .order("concurso_id", { ascending: false })
        .limit(1)
        .single();
      
      if (data?.dezenas) {
        setUltimoSorteio(data.dezenas);
      }
    };
    fetchUltimoSorteio();
  }, []);

  // Inicializar filtros com os valores mais frequentes quando os dados carregarem
  useEffect(() => {
    if (!statsLoading) {
      if (impares.length > 0) setQtdImpares(impares[0].valor);
      if (repetidas.length > 0) setQtdRepetidas(repetidas[0].valor);
      if (primos.length > 0) setQtdPrimos(primos[0].valor);
      if (moldura.length > 0) setQtdMoldura(moldura[0].valor);
    }
  }, [statsLoading, impares, repetidas, primos, moldura]);

  // Validação das somas
  const somaLinhas = linhas.reduce((a, b) => a + b, 0);
  const somaColunas = colunas.reduce((a, b) => a + b, 0);
  const filtrosValidos = somaLinhas === qtdDezenas && somaColunas === qtdDezenas;

  // Montar objeto de filtros
  const filtros: FiltrosDesdobramento = useMemo(() => ({
    qtdImpares,
    qtdRepetidas,
    qtdPrimos,
    qtdMoldura,
    linhas,
    colunas,
    qtdDezenas,
    dezenasUltimoSorteio: ultimoSorteio,
    dezenasFixas,
    dezenasExcluidas,
  }), [qtdImpares, qtdRepetidas, qtdPrimos, qtdMoldura, linhas, colunas, qtdDezenas, ultimoSorteio, dezenasFixas, dezenasExcluidas]);

  // Estimar combinações (com debounce)
  const [estimativa, setEstimativa] = useState<number | null>(null);
  
  useEffect(() => {
    if (!filtrosValidos) {
      setEstimativa(null);
      return;
    }
    
    const timer = setTimeout(() => {
      const count = contarCombinacoes(filtros);
      setEstimativa(count);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [filtros, filtrosValidos]);

  const handleGerar = () => {
    if (!filtrosValidos) return;
    
    setIsGenerating(true);
    setError(null);
    
    // Usar setTimeout para não bloquear a UI
    setTimeout(() => {
      try {
        const jogos = gerarDesdobramento(filtros, qtdPalpites);
        
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
    // Resetar para valores padrão
    if (impares.length > 0) setQtdImpares(impares[0].valor);
    if (repetidas.length > 0) setQtdRepetidas(repetidas[0].valor);
    if (primos.length > 0) setQtdPrimos(primos[0].valor);
    if (moldura.length > 0) setQtdMoldura(moldura[0].valor);
    setLinhas([3, 3, 3, 3, 3]);
    setColunas([3, 3, 3, 3, 3]);
    setQtdDezenas(15);
  };

  if (statsLoading) {
    return (
      <MainLayout pageTitle="Gerador de Desdobramento">
        <div className="container-senior py-6 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="Gerador de Desdobramento">
      <div className="container-senior py-4 space-y-5 max-w-lg mx-auto">
        {/* Header desktop */}
        {!isMobile && (
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Shuffle className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold">Gerador de Desdobramento</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Gere palpites com filtros estatísticos personalizados
            </p>
          </div>
        )}

        {/* Botão para abrir filtros de padrões */}
        <button
          type="button"
          onClick={() => setFiltrosPadroesAbertos(!filtrosPadroesAbertos)}
          className="w-full flex items-center justify-between py-3 px-4 text-sm font-medium bg-card border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <span className="flex items-center gap-2">
            🎯 Filtros de Padrões
          </span>
          {filtrosPadroesAbertos ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {/* Filtros de Padrões */}
        {filtrosPadroesAbertos && (
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FiltroPatternSelector
                  label="Ímpares"
                  emoji="🔢"
                  value={qtdImpares}
                  onChange={setQtdImpares}
                  options={impares}
                  complementLabel="pares"
                />
                
                <FiltroPatternSelector
                  label="Repetidas"
                  emoji="🔄"
                  value={qtdRepetidas}
                  onChange={setQtdRepetidas}
                  options={repetidas}
                  complementLabel="novas"
                />
                
                <FiltroPatternSelector
                  label="Primos"
                  emoji="✨"
                  value={qtdPrimos}
                  onChange={setQtdPrimos}
                  options={primos}
                  complementLabel="não primos"
                />
                
                <FiltroPatternSelector
                  label="Moldura"
                  emoji="🖼️"
                  value={qtdMoldura}
                  onChange={setQtdMoldura}
                  options={moldura}
                  complementLabel="miolo"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão para abrir filtros de Linhas/Colunas */}
        <button
          type="button"
          onClick={() => setFiltrosAvancadosAbertos(!filtrosAvancadosAbertos)}
          className="w-full flex items-center justify-between py-3 px-4 text-sm font-medium bg-card border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <span className="flex items-center gap-2">
            📐 Filtros de Linhas e Colunas
            {!filtrosValidos && (somaLinhas > 0 || somaColunas > 0) && (
              <Badge variant="destructive" className="text-[10px]">
                Ajustar
              </Badge>
            )}
          </span>
          {filtrosAvancadosAbertos ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {/* Filtros de Linhas e Colunas */}
        {filtrosAvancadosAbertos && (
          <FiltroLinhasColunas
            linhas={linhas}
            colunas={colunas}
            onLinhasChange={setLinhas}
            onColunasChange={setColunas}
            qtdDezenas={qtdDezenas}
          />
        )}


        {/* Erro de validação */}
        {!filtrosValidos && (somaLinhas > 0 || somaColunas > 0) && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">
              A soma das linhas ({somaLinhas}) e colunas ({somaColunas}) deve ser igual a {qtdDezenas}.
            </p>
          </div>
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
          {/* Input de quantidade de palpites */}
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Gerar</span>
            <input
              type="text"
              inputMode="numeric"
              value={qtdPalpites}
              onChange={(e) => {
                const val = parseInt(e.target.value.replace(/\D/g, ""), 10);
                if (!isNaN(val) && val >= 1 && val <= 250) {
                  setQtdPalpites(val);
                } else if (e.target.value === "") {
                  setQtdPalpites(1);
                }
              }}
              onBlur={(e) => {
                const val = parseInt(e.target.value, 10);
                if (isNaN(val) || val < 1) setQtdPalpites(1);
                else if (val > 250) setQtdPalpites(250);
              }}
              className="w-16 h-10 bg-background text-center text-base font-semibold rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
              {[15, 16, 17, 18, 19, 20].map((num) => (
                <DropdownMenuItem
                  key={num}
                  onClick={() => setQtdDezenas(num)}
                  className={cn(
                    "justify-center text-sm font-medium cursor-pointer",
                    qtdDezenas === num && "bg-primary/10 text-primary"
                  )}
                >
                  {num} dezenas
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>


        {/* Grid de Dezenas - Fullscreen style */}
        <div className="space-y-3">
          <ModoSeletorDesdobramento modo={modoGrid} onChange={setModoGrid} />
          <GridDesdobramento
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
            className="flex-1 h-14 text-lg gap-2"
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

        {/* Resultados */}
        {jogosGerados && jogosGerados.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center justify-between">
                <span>🎲 Palpites Gerados</span>
                <Badge variant="secondary">{jogosGerados.length} jogos</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {jogosGerados.slice(0, 50).map((jogo, index) => (
                <div key={index} className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Jogo {index + 1}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {jogo.dezenas.map((dezena) => (
                      <DezenaCirculoMini key={dezena} dezena={dezena} />
                    ))}
                  </div>
                </div>
              ))}
              
              {jogosGerados.length > 50 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  Exibindo 50 de {jogosGerados.length} jogos
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
