import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { EstrategiaFechamentoSelector, ESTRATEGIAS_FECHAMENTO } from "@/components/fechamento/EstrategiaFechamentoSelector";
import { FechamentoRulesCard } from "@/components/fechamento/FechamentoRulesCard";
import { FechamentoStatusBar } from "@/components/fechamento/FechamentoStatusBar";
import { ModoSeletorFixas } from "@/components/fechamento/ModoSeletorFixas";
import { ResultadosFechamento } from "@/components/fechamento/ResultadosFechamento";
import { cn } from "@/lib/utils";
import { formatarDezena } from "@/lib/lotofacil";
import { gerarFechamento, ResultadoFechamento } from "@/lib/fechamento";

export default function Fechamento() {
  const [estrategiaId, setEstrategiaId] = useState("16-14-4");
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [fixas, setFixas] = useState<number[]>([]);
  const [modo, setModo] = useState<"selecionar" | "fixar">("selecionar");
  const [resultado, setResultado] = useState<ResultadoFechamento | null>(null);

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
  };

  const handleMudarEstrategia = (value: string) => {
    setEstrategiaId(value);
    setSelecionadas([]);
    setFixas([]);
  };

  // Se tem resultado, mostra a tela de resultados
  if (resultado) {
    return (
      <MainLayout pageTitle="Gerador de Fechamento">
        <div className="container-senior py-4">
          <ResultadosFechamento 
            jogos={resultado.jogos}
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

        {/* 3. Seletor de Modo */}
        <ModoSeletorFixas modo={modo} onChange={setModo} />

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
                      ? "bg-foreground text-background border-foreground"
                      : estaSelecionada 
                        ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105" 
                        : "bg-card border-border text-foreground hover:border-primary/50 hover:shadow-md"
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
          className="w-full gap-2"
          size="lg"
        >
          <Sparkles className="h-5 w-5" />
          Gerar {estrategiaAtual.jogos} Jogos
        </Button>
      </div>
    </MainLayout>
  );
}
