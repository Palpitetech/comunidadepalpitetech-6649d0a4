import { useState, useMemo, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles, Loader2 } from "lucide-react";
import { 
  EstrategiaFechamentoSelectorDuplaSena, 
  ESTRATEGIAS_FECHAMENTO_DUPLASENA 
} from "@/components/duplasena/EstrategiaFechamentoSelectorDuplaSena";
import { FechamentoRulesCardDuplaSena } from "@/components/duplasena/FechamentoRulesCardDuplaSena";
import { FechamentoStatusBarDuplaSena } from "@/components/duplasena/FechamentoStatusBarDuplaSena";
import { ModoSeletorFixasDuplaSena } from "@/components/duplasena/ModoSeletorFixasDuplaSena";
import { LoadingPalpiteIA } from "@/components/megasena/LoadingPalpiteIA";
import { ResultadosFechamentoDuplaSena } from "@/components/duplasena/ResultadosFechamentoDuplaSena";
import { EstrategiaCardDuplaSena } from "@/components/duplasena/EstrategiaCardDuplaSena";
import { useAutoFillDuplaSena, type EstrategiaDuplaSena } from "@/hooks/useAutoFillDuplaSena";
import { useComputeFechamento } from "@/hooks/useComputeFechamento";
import { 
  formatarDezenaDuplaSena,
  type ResultadoFechamentoDuplaSena as ResultadoType
} from "@/lib/fechamentoDuplaSena";

export default function FechamentoDuplaSena() {
  const [estrategiaId, setEstrategiaId] = useState("7-5-7");
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [fixas, setFixas] = useState<number[]>([]);
  const [modo, setModo] = useState<"selecionar" | "fixar">("selecionar");
  const [resultado, setResultado] = useState<ResultadoType | null>(null);
  const [estrategiaIA, setEstrategiaIA] = useState<EstrategiaDuplaSena | null>(null);

  const { isLoading: isAutoFilling, canUse, autoFill, checkUsage } = useAutoFillDuplaSena();
  const { compute, isComputing } = useComputeFechamento();

  useEffect(() => { checkUsage(); }, []);

  const estrategiaAtual = useMemo(() => 
    ESTRATEGIAS_FECHAMENTO_DUPLASENA.find(e => e.id === estrategiaId) || ESTRATEGIAS_FECHAMENTO_DUPLASENA[0],
    [estrategiaId]
  );

  const totalSelecionadas = selecionadas.length;
  const totalFixas = fixas.length;
  const totalDezenasCorreto = (totalSelecionadas + totalFixas) === estrategiaAtual.dezenas;
  const fixasObrigatoriasCumpridas = estrategiaAtual.fixasObrigatorias === 0 || totalFixas === estrategiaAtual.fixasObrigatorias;
  const podeGerar = totalDezenasCorreto && fixasObrigatoriasCumpridas;

  // Grid 10x5 = 50 dezenas (Dupla Sena: 1-50)
  const dezenas = Array.from({ length: 50 }, (_, i) => i + 1);

  const handleToggle = (numero: number) => {
    if (modo === "selecionar") {
      if (fixas.includes(numero)) return;
      setSelecionadas(prev => {
        if (prev.includes(numero)) return prev.filter(n => n !== numero);
        if ((prev.length + fixas.length) >= estrategiaAtual.dezenas) return prev;
        return [...prev, numero];
      });
    } else {
      if (selecionadas.includes(numero)) {
        setSelecionadas(prev => prev.filter(n => n !== numero));
        setFixas(prev => {
          if ((selecionadas.length - 1 + prev.length) >= estrategiaAtual.dezenas) return prev;
          return [...prev, numero];
        });
        return;
      }
      setFixas(prev => {
        if (prev.includes(numero)) return prev.filter(n => n !== numero);
        if ((selecionadas.length + prev.length) >= estrategiaAtual.dezenas) return prev;
        return [...prev, numero];
      });
    }
  };

  const handleGerarFechamento = () => {
    if (!podeGerar) return;
    try {
      const todasDezenas = [...new Set([...fixas, ...selecionadas])];
      setResultado(gerarFechamentoDuplaSena(estrategiaId, todasDezenas));
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
    const result = await autoFill(estrategiaId, estrategiaAtual.dezenas);
    if (result) {
      setSelecionadas(result.dezenas);
      setFixas([]);
      setEstrategiaIA(result.estrategia);
    }
  };

  if (resultado) {
    return (
      <MainLayout 
        pageTitle="Palpites Gerados" 
        onBack={handleNovoFechamento}
        breadcrumb={[{ label: "Fechamento", onClick: handleNovoFechamento }]}
      >
        <div className="container-senior py-4">
          <ResultadosFechamentoDuplaSena 
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
    <MainLayout pageTitle="Fechamento Dupla Sena">
      <div className="container-senior py-4 space-y-5">
        <EstrategiaFechamentoSelectorDuplaSena value={estrategiaId} onChange={handleMudarEstrategia} />
        <FechamentoRulesCardDuplaSena estrategia={estrategiaAtual} />

        <div className="flex items-center gap-2">
          <ModoSeletorFixasDuplaSena modo={modo} onChange={setModo} />
          <Button
            onClick={handleAutoFill}
            disabled={isAutoFilling || !canUse}
            className="bg-highlight hover:bg-highlight/90 text-highlight-foreground font-semibold whitespace-nowrap"
            size="default"
          >
            {isAutoFilling ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Gerando...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" />Quero Palpite</>
            )}
          </Button>
        </div>

        <LoadingPalpiteIA isLoading={isAutoFilling} />

        {estrategiaIA && <EstrategiaCardDuplaSena estrategia={estrategiaIA} />}

        {/* Grid de Números (10x5) */}
        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-10 gap-1.5">
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
                    "text-xs sm:text-sm font-bold",
                    "active:scale-95",
                    "disabled:opacity-40 disabled:cursor-not-allowed",
                    estaFixa
                      ? "bg-palpite-fixa text-palpite-fixa-foreground border-palpite-fixa"
                      : estaSelecionada 
                        ? "bg-duplasena-primary text-duplasena-primary-foreground border-duplasena-primary shadow-lg scale-105" 
                        : "bg-card border-border text-foreground hover:border-duplasena-primary/50 hover:shadow-md"
                  )}
                >
                  {formatarDezenaDuplaSena(numero)}
                </button>
              );
            })}
          </div>
        </div>

        <FechamentoStatusBarDuplaSena 
          total={estrategiaAtual.dezenas}
          selecionados={totalSelecionadas}
          fixos={totalFixas}
        />

        <Button
          onClick={handleGerarFechamento}
          disabled={!podeGerar}
          className="w-full bg-duplasena-primary hover:bg-duplasena-primary/90"
          size="lg"
        >
          Gerar Palpites
        </Button>
      </div>
    </MainLayout>
  );
}
