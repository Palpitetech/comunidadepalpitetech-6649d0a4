import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Trash2, Sparkles } from "lucide-react";
import { TipoFechamentoSelector, TIPOS_FECHAMENTO } from "@/components/fechamento/TipoFechamentoSelector";
import { GridDezenasVolante } from "@/components/fechamento/GridDezenasVolante";
import { isImpar, isMoldura, isMultiploDe3 } from "@/lib/lotofacil";
import { cn } from "@/lib/utils";

export default function Fechamento() {
  const [tipoFechamento, setTipoFechamento] = useState("18-14");
  const [modo, setModo] = useState<"selecionar" | "fixar">("selecionar");
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [fixas, setFixas] = useState<number[]>([]);

  // Obtém os dados do tipo de fechamento selecionado
  const tipoAtual = useMemo(() => 
    TIPOS_FECHAMENTO.find(t => t.id === tipoFechamento) || TIPOS_FECHAMENTO[0],
    [tipoFechamento]
  );

  // Todas as dezenas selecionadas (selecionadas + fixas)
  const todasSelecionadas = useMemo(() => 
    [...new Set([...selecionadas, ...fixas])],
    [selecionadas, fixas]
  );

  // Calcula estatísticas das dezenas selecionadas
  const estatisticas = useMemo(() => {
    const impares = todasSelecionadas.filter(isImpar).length;
    const moldura = todasSelecionadas.filter(isMoldura).length;
    const multiplosDe3 = todasSelecionadas.filter(isMultiploDe3).length;
    return { impares, moldura, multiplosDe3 };
  }, [todasSelecionadas]);

  const totalSelecionadas = todasSelecionadas.length;
  const podeGerar = totalSelecionadas >= tipoAtual.dezenas;

  const handleToggle = (numero: number) => {
    if (modo === "selecionar") {
      // Se já está fixa, remove das fixas
      if (fixas.includes(numero)) {
        setFixas(prev => prev.filter(n => n !== numero));
        return;
      }
      
      setSelecionadas(prev => 
        prev.includes(numero) 
          ? prev.filter(n => n !== numero)
          : [...prev, numero]
      );
    } else {
      // Modo fixar
      if (selecionadas.includes(numero)) {
        setSelecionadas(prev => prev.filter(n => n !== numero));
        setFixas(prev => [...prev, numero]);
        return;
      }
      
      setFixas(prev => 
        prev.includes(numero) 
          ? prev.filter(n => n !== numero)
          : [...prev, numero]
      );
    }
  };

  const handleLimparSelecionadas = () => {
    setSelecionadas([]);
  };

  const handleLimparTudo = () => {
    setSelecionadas([]);
    setFixas([]);
  };

  const handleGerarFechamento = () => {
    console.log("Gerar fechamento com:", {
      tipo: tipoAtual,
      selecionadas,
      fixas,
      total: todasSelecionadas
    });
  };

  return (
    <MainLayout pageTitle="Gerador de Fechamento">
      <div className="container-senior py-4 space-y-4">
        {/* Tipo de Fechamento */}
        <TipoFechamentoSelector
          value={tipoFechamento}
          onChange={setTipoFechamento}
        />

        {/* Barra de Ações: Modo + Limpeza */}
        <div className="flex items-center justify-between gap-2">
          {/* Toggle Selecionar/Fixar */}
          <div className="flex rounded-lg p-1 bg-muted/50">
            <button
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                modo === "selecionar" 
                  ? "bg-background shadow-sm text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setModo("selecionar")}
            >
              Selecionar
            </button>
            <button
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                modo === "fixar" 
                  ? "bg-amber-100 text-amber-700 shadow-sm dark:bg-amber-900/50 dark:text-amber-300" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setModo("fixar")}
            >
              Fixar
            </button>
          </div>

          {/* Botões de Limpeza */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLimparSelecionadas}
              disabled={selecionadas.length === 0}
              className="text-muted-foreground"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Seleção</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLimparTudo}
              disabled={totalSelecionadas === 0}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Tudo</span>
            </Button>
          </div>
        </div>

        {/* Grid de Dezenas */}
        <div className="max-w-xs mx-auto">
          <GridDezenasVolante
            selecionadas={selecionadas}
            fixas={fixas}
            modo={modo}
            onToggle={handleToggle}
          />
        </div>

        {/* Estatísticas */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>Ímpar: <strong className="text-foreground">{estatisticas.impares}</strong></span>
          <span>Moldura: <strong className="text-foreground">{estatisticas.moldura}</strong></span>
          <span>Múltiplo 3: <strong className="text-foreground">{estatisticas.multiplosDe3}</strong></span>
          <span>Total: <strong className={cn(
            podeGerar ? "text-primary" : "text-foreground"
          )}>{totalSelecionadas}/{tipoAtual.dezenas}</strong></span>
        </div>

        {/* Botão Gerar */}
        <Button
          onClick={handleGerarFechamento}
          disabled={!podeGerar}
          className="w-full gap-2"
          size="lg"
        >
          <Sparkles className="h-5 w-5" />
          Gerar Fechamento
        </Button>
      </div>
    </MainLayout>
  );
}
