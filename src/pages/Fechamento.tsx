import { useState, useMemo, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAutoFillFechamento } from "@/hooks/useAutoFillFechamento";
import { useUserRole } from "@/hooks/useUserRole";
import { useComputeFechamento } from "@/hooks/useComputeFechamento";
import { Badge } from "@/components/ui/badge";
import { EstrategiaFechamentoSelector, ESTRATEGIAS_FECHAMENTO } from "@/components/fechamento/EstrategiaFechamentoSelector";
import { FechamentoRulesCard } from "@/components/fechamento/FechamentoRulesCard";
import { FechamentoStatusBar } from "@/components/fechamento/FechamentoStatusBar";
import { ModoSeletorFixas } from "@/components/fechamento/ModoSeletorFixas";
import { ResultadosFechamento } from "@/components/fechamento/ResultadosFechamento";
import { EstrategiaCard, type EstrategiaData } from "@/components/gerador/EstrategiaCard";
import { cn } from "@/lib/utils";
import { formatarDezena } from "@/lib/lotofacil";
import type { ResultadoFechamento } from "@/lib/fechamento";

const LOADING_MESSAGES = [
  "Analisando suas ferramentas...",
  "Agora alinhando as melhores dezenas...",
  "Uau, você vai ter muitas chances!",
  "Ansioso para te entregar sua estratégia...",
];

export default function Fechamento() {
  const [estrategiaId, setEstrategiaId] = useState("16-14-4");
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [fixas, setFixas] = useState<number[]>([]);
  const [modo, setModo] = useState<"selecionar" | "fixar">("selecionar");
  const [resultado, setResultado] = useState<ResultadoFechamento | null>(null);
  const [estrategiaIA, setEstrategiaIA] = useState<EstrategiaData | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { isLoading: isAutoFilling, canUse, usageCount, autoFill, checkUsage } = useAutoFillFechamento();
  const { isAdmin } = useUserRole();
  const { compute, isComputing } = useComputeFechamento();

  // Verificar uso ao carregar
  useEffect(() => {
    checkUsage();
  }, []);

  // Obtém os dados da estratégia selecionada
  const estrategiaAtual = useMemo(() => 
    ESTRATEGIAS_FECHAMENTO.find(e => e.id === estrategiaId) || ESTRATEGIAS_FECHAMENTO[0],
    [estrategiaId]
  );

  const totalSelecionadas = selecionadas.length;
  const totalFixas = fixas.length;
  
  // Validação para gerar: total de dezenas correto E fixas obrigatórias cumpridas
  const totalDezenasCorreto = (totalSelecionadas + totalFixas) === estrategiaAtual.dezenas;
  const fixasObrigatoriasCumpridas = estrategiaAtual.fixasObrigatorias === 0 || totalFixas === estrategiaAtual.fixasObrigatorias;
  const podeGerar = totalDezenasCorreto && fixasObrigatoriasCumpridas;

  // Gera os números de 1 a 25
  const dezenas = Array.from({ length: 25 }, (_, i) => i + 1);

  const handleToggle = (numero: number) => {
    if (modo === "selecionar") {
      // Se está fixado, não permite selecionar (precisa desfixar primeiro)
      if (fixas.includes(numero)) return;
      
      setSelecionadas(prev => {
        if (prev.includes(numero)) {
          return prev.filter(n => n !== numero);
        }
        if ((prev.length + fixas.length) >= estrategiaAtual.dezenas) {
          return prev;
        }
        return [...prev, numero];
      });
    } else {
      // Modo fixar
      // Se já está selecionado, converte para fixa (sobrepõe)
      if (selecionadas.includes(numero)) {
        // Remove das selecionadas e adiciona nas fixas
        setSelecionadas(prev => prev.filter(n => n !== numero));
        setFixas(prev => {
          if ((selecionadas.length - 1 + prev.length) >= estrategiaAtual.dezenas) {
            return prev;
          }
          return [...prev, numero];
        });
        return;
      }
      
      setFixas(prev => {
        if (prev.includes(numero)) {
          return prev.filter(n => n !== numero);
        }
        if ((selecionadas.length + prev.length) >= estrategiaAtual.dezenas) {
          return prev;
        }
        return [...prev, numero];
      });
    }
  };

  const handleGerarFechamento = async () => {
    if (!podeGerar || isComputing) return;
    
    try {
      const todasDezenas = [...new Set([...fixas, ...selecionadas])];
      const resultadoGerado = await compute("lotofacil", estrategiaId, todasDezenas);
      if (resultadoGerado) {
        setResultado(resultadoGerado as ResultadoFechamento);
      }
    } catch (error) {
      console.error("Erro ao gerar fechamento:", error);
    }
  };

  const handleNovoFechamento = () => {
    setResultado(null);
    setSelecionadas([]);
    setFixas([]);
    setEstrategiaIA(null);
  };

  const handleMudarEstrategia = (value: string) => {
    setEstrategiaId(value);
    setSelecionadas([]);
    setFixas([]);
    setEstrategiaIA(null);
  };

  const handleAutoFill = async () => {
    // Inicia animação de mensagens
    setLoadingMessageIndex(0);
    loadingIntervalRef.current = setInterval(() => {
      setLoadingMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);

    const result = await autoFill(estrategiaId, estrategiaAtual.dezenas);
    
    // Para a animação
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
    }

    if (result) {
      // Para estratégias com fixas obrigatórias, separar as dezenas
      if (estrategiaAtual.fixasObrigatorias > 0) {
        // Primeiras N dezenas são fixas, restante são variáveis (selecionadas)
        const fixasGeradas = result.dezenas.slice(0, estrategiaAtual.fixasObrigatorias);
        const variaveisGeradas = result.dezenas.slice(estrategiaAtual.fixasObrigatorias);
        
        setFixas(fixasGeradas);
        setSelecionadas(variaveisGeradas);
        setModo("fixar"); // Mudar para modo fixar para mostrar as fixas
      } else {
        // Estratégias sem fixas: todas vão para selecionadas
        setSelecionadas(result.dezenas);
        setFixas([]);
        setModo("selecionar");
      }
      setEstrategiaIA(result.estrategia);
    }
  };

  // Cleanup do interval ao desmontar
  useEffect(() => {
    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    };
  }, []);

  // Se tem resultado, mostra a tela de resultados
  if (resultado) {
    return (
      <MainLayout 
        pageTitle="Palpites Gerados" 
        onBack={handleNovoFechamento}
        breadcrumb={[{ label: "Fechamento", onClick: handleNovoFechamento }]}
      >
        <div className="container-senior py-4">
          <ResultadosFechamento 
            jogos={resultado.jogos}
            fixas={fixas}
            estrategiaId={estrategiaId}
            dezenasSelecionadas={[...new Set([...fixas, ...selecionadas])]}
            onNovoFechamento={handleNovoFechamento}
            estrategiaIA={estrategiaIA}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="Gerador de Fechamento">
      <div className="container-senior py-4 space-y-5">
        {/* Aviso de precisão */}

        {/* 1. Seletor de Garantia */}
        <EstrategiaFechamentoSelector
          value={estrategiaId}
          onChange={handleMudarEstrategia}
        />

        {/* 2. Card de Regras */}
        <FechamentoRulesCard estrategia={estrategiaAtual} />


        {/* 3. Seletor de Modo + Quero uma Estratégia */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <ModoSeletorFixas modo={modo} onChange={setModo} />
            <Button
              size="sm"
              onClick={handleAutoFill}
              disabled={isAutoFilling || !canUse}
              className="gap-1 shrink-0 px-2 text-xs sm:text-sm sm:px-3 bg-highlight hover:bg-highlight/90 text-highlight-foreground border-0"
            >
              {isAutoFilling ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              <span className="whitespace-nowrap">Quero Estratégia</span>
              {!isAdmin && (
                <Badge variant={canUse ? "secondary" : "outline"} className="text-[10px] px-1">
                  {usageCount}/1
                </Badge>
              )}
            </Button>
          </div>

          {/* Loading message durante auto-fill */}
          {isAutoFilling && (
            <div className="text-center py-2 px-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs text-primary font-medium animate-pulse">
                {LOADING_MESSAGES[loadingMessageIndex]}
              </p>
            </div>
          )}
        </div>

        {/* Card de Estratégia IA (quando preenchido automaticamente) */}
        {estrategiaIA && (
          <EstrategiaCard estrategia={estrategiaIA} />
        )}

        {/* 4. Grid de Números (Volante) */}
        <div className="max-w-sm mx-auto">
          <div className="grid grid-cols-5 gap-2">
            {dezenas.map((numero) => {
              const estaSelecionada = selecionadas.includes(numero);
              const estaFixa = fixas.includes(numero);
              const podeConcorrer = (selecionadas.length + fixas.length) < estrategiaAtual.dezenas;

              return (
                <button
                  key={numero}
                  type="button"
                  onClick={() => handleToggle(numero)}
                  disabled={!estaSelecionada && !estaFixa && !podeConcorrer}
                  className={cn(
                    "aspect-square rounded-full border-2 transition-all duration-200",
                    "flex items-center justify-center",
                    "text-lg font-bold",
                    "active:scale-95",
                    "disabled:opacity-40 disabled:cursor-not-allowed",
                    estaFixa
                      ? "bg-palpite-fixa text-palpite-fixa-foreground border-palpite-fixa"
                      : estaSelecionada 
                        ? "bg-palpite-dezena text-palpite-dezena-foreground border-palpite-dezena shadow-lg scale-105" 
                        : "bg-card border-border text-foreground hover:border-palpite-dezena/50 hover:shadow-md"
                  )}
                >
                  {formatarDezena(numero)}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Barra de Status */}
        <FechamentoStatusBar 
          total={estrategiaAtual.dezenas}
          selecionados={totalSelecionadas}
          fixos={totalFixas}
        />

        {/* 5. Botão Gerar */}
        <Button
          onClick={handleGerarFechamento}
          disabled={!podeGerar}
          className="w-full"
          size="lg"
        >
          Gerar Palpites
        </Button>
      </div>
    </MainLayout>
  );
}
