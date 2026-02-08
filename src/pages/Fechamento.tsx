import { useState, useMemo, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Wand2, Loader2 } from "lucide-react";
import { useAutoFillFechamento } from "@/hooks/useAutoFillFechamento";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";
import { EstrategiaFechamentoSelector, ESTRATEGIAS_FECHAMENTO } from "@/components/fechamento/EstrategiaFechamentoSelector";
import { FechamentoRulesCard } from "@/components/fechamento/FechamentoRulesCard";
import { FechamentoStatusBar } from "@/components/fechamento/FechamentoStatusBar";
import { ModoSeletorFixas } from "@/components/fechamento/ModoSeletorFixas";
import { ResultadosFechamento } from "@/components/fechamento/ResultadosFechamento";
import { EstrategiaCard, type EstrategiaData } from "@/components/gerador/EstrategiaCard";
import { cn } from "@/lib/utils";
import { formatarDezena } from "@/lib/lotofacil";
import { gerarFechamento, ResultadoFechamento } from "@/lib/fechamento";

export default function Fechamento() {
  const [estrategiaId, setEstrategiaId] = useState("16-14-4");
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [fixas, setFixas] = useState<number[]>([]);
  const [modo, setModo] = useState<"selecionar" | "fixar">("selecionar");
  const [resultado, setResultado] = useState<ResultadoFechamento | null>(null);
  const [estrategiaIA, setEstrategiaIA] = useState<EstrategiaData | null>(null);

  const { isLoading: isAutoFilling, canUse, usageCount, autoFill, checkUsage } = useAutoFillFechamento();
  const { isAdmin } = useUserRole();

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
  const podeGerar = (totalSelecionadas + totalFixas) === estrategiaAtual.dezenas;

  // Gera os números de 1 a 25
  const dezenas = Array.from({ length: 25 }, (_, i) => i + 1);

  const handleToggle = (numero: number) => {
    if (modo === "selecionar") {
      // Não permite selecionar número que já está fixado
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
      // Não permite fixar número que já está selecionado
      if (selecionadas.includes(numero)) return;
      
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

  const handleGerarFechamento = () => {
    if (!podeGerar) return;
    
    try {
      // Combina selecionadas + fixas para gerar o fechamento
      const todasDezenas = [...new Set([...selecionadas, ...fixas])];
      const resultadoGerado = gerarFechamento(estrategiaId, todasDezenas);
      setResultado(resultadoGerado);
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
      setModo("selecionar");
      setEstrategiaIA(result.estrategia);
    }
  };

  // Se tem resultado, mostra a tela de resultados
  if (resultado) {
    return (
      <MainLayout pageTitle="Gerador de Fechamento">
        <div className="container-senior py-4">
          <ResultadosFechamento 
            jogos={resultado.jogos}
            fixas={fixas}
            estrategiaId={estrategiaId}
            dezenasSelecionadas={[...new Set([...selecionadas, ...fixas])]}
            onNovoFechamento={handleNovoFechamento}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="Gerador de Fechamento">
      <div className="container-senior py-4 space-y-5">
        {/* 1. Seletor de Garantia */}
        <EstrategiaFechamentoSelector
          value={estrategiaId}
          onChange={handleMudarEstrategia}
        />

        {/* 2. Card de Regras */}
        <FechamentoRulesCard estrategia={estrategiaAtual} />

        {/* 3. Seletor de Modo + Auto Preencher */}
        <div className="flex items-center gap-2">
          <ModoSeletorFixas modo={modo} onChange={setModo} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoFill}
            disabled={isAutoFilling || !canUse}
            className="gap-1.5 shrink-0"
          >
            {isAutoFilling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Auto Preencher</span>
            {!isAdmin && (
              <Badge variant={canUse ? "secondary" : "outline"} className="ml-1 text-xs">
                {usageCount}/1
              </Badge>
            )}
          </Button>
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
