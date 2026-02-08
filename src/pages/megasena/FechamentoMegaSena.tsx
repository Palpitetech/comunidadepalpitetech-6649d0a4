import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  EstrategiaFechamentoSelectorMegaSena, 
  ESTRATEGIAS_FECHAMENTO_MEGASENA 
} from "@/components/megasena/EstrategiaFechamentoSelectorMegaSena";
import { FechamentoRulesCardMegaSena } from "@/components/megasena/FechamentoRulesCardMegaSena";
import { FechamentoStatusBarMegaSena } from "@/components/megasena/FechamentoStatusBarMegaSena";
import { ModoSeletorFixas } from "@/components/fechamento/ModoSeletorFixas";
import { ResultadosFechamentoMegaSena } from "@/components/megasena/ResultadosFechamentoMegaSena";
import { 
  gerarFechamentoMegaSena, 
  formatarDezenaMegaSena,
  type ResultadoFechamentoMegaSena 
} from "@/lib/fechamentoMegaSena";

export default function FechamentoMegaSena() {
  const [estrategiaId, setEstrategiaId] = useState("7-5-7");
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [fixas, setFixas] = useState<number[]>([]);
  const [modo, setModo] = useState<"selecionar" | "fixar">("selecionar");
  const [resultado, setResultado] = useState<ResultadoFechamentoMegaSena | null>(null);

  const estrategiaAtual = useMemo(() => 
    ESTRATEGIAS_FECHAMENTO_MEGASENA.find(e => e.id === estrategiaId) || ESTRATEGIAS_FECHAMENTO_MEGASENA[0],
    [estrategiaId]
  );

  const totalSelecionadas = selecionadas.length;
  const totalFixas = fixas.length;
  
  const totalDezenasCorreto = (totalSelecionadas + totalFixas) === estrategiaAtual.dezenas;
  const fixasObrigatoriasCumpridas = estrategiaAtual.fixasObrigatorias === 0 || totalFixas === estrategiaAtual.fixasObrigatorias;
  const podeGerar = totalDezenasCorreto && fixasObrigatoriasCumpridas;

  // Grid 10x6 = 60 dezenas
  const dezenas = Array.from({ length: 60 }, (_, i) => i + 1);

  const handleToggle = (numero: number) => {
    if (modo === "selecionar") {
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
      if (selecionadas.includes(numero)) {
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

  const handleGerarFechamento = () => {
    if (!podeGerar) return;
    
    try {
      const todasDezenas = [...new Set([...fixas, ...selecionadas])];
      const resultadoGerado = gerarFechamentoMegaSena(estrategiaId, todasDezenas);
      setResultado(resultadoGerado);
    } catch (error) {
      console.error("Erro ao gerar fechamento:", error);
    }
  };

  const handleNovoFechamento = () => {
    setResultado(null);
    setSelecionadas([]);
    setFixas([]);
  };

  const handleMudarEstrategia = (value: string) => {
    setEstrategiaId(value);
    setSelecionadas([]);
    setFixas([]);
  };

  if (resultado) {
    return (
      <MainLayout 
        pageTitle="Palpites Gerados" 
        onBack={handleNovoFechamento}
        breadcrumb={[{ label: "Fechamento", onClick: handleNovoFechamento }]}
      >
        <div className="container-senior py-4">
          <ResultadosFechamentoMegaSena 
            jogos={resultado.jogos}
            fixas={fixas}
            estrategiaId={estrategiaId}
            dezenasSelecionadas={[...new Set([...fixas, ...selecionadas])]}
            onNovoFechamento={handleNovoFechamento}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="Fechamento Mega Sena">
      <div className="container-senior py-4 space-y-5">
        {/* 1. Seletor de Garantia */}
        <EstrategiaFechamentoSelectorMegaSena
          value={estrategiaId}
          onChange={handleMudarEstrategia}
        />

        {/* 2. Card de Regras */}
        <FechamentoRulesCardMegaSena estrategia={estrategiaAtual} />

        {/* 3. Seletor de Modo */}
        <div className="flex items-center gap-2">
          <ModoSeletorFixas modo={modo} onChange={setModo} />
        </div>

        {/* 4. Grid de Números (10x6) */}
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
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-lg scale-105" 
                        : "bg-card border-border text-foreground hover:border-emerald-500/50 hover:shadow-md"
                  )}
                >
                  {formatarDezenaMegaSena(numero)}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Barra de Status */}
        <FechamentoStatusBarMegaSena 
          total={estrategiaAtual.dezenas}
          selecionados={totalSelecionadas}
          fixos={totalFixas}
        />

        {/* 6. Botão Gerar */}
        <Button
          onClick={handleGerarFechamento}
          disabled={!podeGerar}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
          size="lg"
        >
          Gerar Palpites
        </Button>
      </div>
    </MainLayout>
  );
}
