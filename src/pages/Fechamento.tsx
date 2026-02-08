import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Trash2, Sparkles } from "lucide-react";
import { EstrategiaFechamentoSelector, ESTRATEGIAS_FECHAMENTO } from "@/components/fechamento/EstrategiaFechamentoSelector";
import { ResultadosFechamento } from "@/components/fechamento/ResultadosFechamento";
import { cn } from "@/lib/utils";
import { formatarDezena } from "@/lib/lotofacil";
import { gerarFechamento, ResultadoFechamento } from "@/lib/fechamento";

export default function Fechamento() {
  const [estrategiaId, setEstrategiaId] = useState("16-14-4");
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [resultado, setResultado] = useState<ResultadoFechamento | null>(null);

  // Obtém os dados da estratégia selecionada
  const estrategiaAtual = useMemo(() => 
    ESTRATEGIAS_FECHAMENTO.find(e => e.id === estrategiaId) || ESTRATEGIAS_FECHAMENTO[0],
    [estrategiaId]
  );

  const totalSelecionadas = selecionadas.length;
  const podeGerar = totalSelecionadas === estrategiaAtual.dezenas;

  // Gera os números de 1 a 25
  const dezenas = Array.from({ length: 25 }, (_, i) => i + 1);

  const handleToggle = (numero: number) => {
    setSelecionadas(prev => {
      if (prev.includes(numero)) {
        return prev.filter(n => n !== numero);
      }
      // Não permite selecionar mais que o necessário
      if (prev.length >= estrategiaAtual.dezenas) {
        return prev;
      }
      return [...prev, numero];
    });
  };

  const handleLimparTudo = () => {
    setSelecionadas([]);
  };

  const handleGerarFechamento = () => {
    if (!podeGerar) return;
    
    try {
      const resultadoGerado = gerarFechamento(estrategiaId, selecionadas);
      setResultado(resultadoGerado);
    } catch (error) {
      console.error("Erro ao gerar fechamento:", error);
    }
  };

  const handleNovoFechamento = () => {
    setResultado(null);
    setSelecionadas([]);
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
      <div className="container-senior py-4 space-y-6">
        {/* Seletor de Estratégia */}
        <EstrategiaFechamentoSelector
          value={estrategiaId}
          onChange={(value) => {
            setEstrategiaId(value);
            setSelecionadas([]);
          }}
        />

        {/* Contador Flutuante */}
        <div className="sticky top-0 z-10 py-2 bg-background/95 backdrop-blur-sm border-b border-border -mx-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-2xl font-bold",
                podeGerar ? "text-primary" : "text-foreground"
              )}>
                {totalSelecionadas}
              </span>
              <span className="text-muted-foreground">
                / {estrategiaAtual.dezenas} números
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLimparTudo}
              disabled={totalSelecionadas === 0}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          </div>
          
          {podeGerar && (
            <p className="text-sm text-primary font-medium mt-1">
              ✓ Pronto para gerar {estrategiaAtual.jogos} jogos!
            </p>
          )}
        </div>

        {/* Grid de Números (Volante) */}
        <div className="max-w-sm mx-auto">
          <div className="grid grid-cols-5 gap-2">
            {dezenas.map((numero) => {
              const estaSelecionada = selecionadas.includes(numero);
              const podeConcorrer = selecionadas.length < estrategiaAtual.dezenas;

              return (
                <button
                  key={numero}
                  type="button"
                  onClick={() => handleToggle(numero)}
                  disabled={!estaSelecionada && !podeConcorrer}
                  className={cn(
                    "aspect-square rounded-full border-2 transition-all duration-200",
                    "flex items-center justify-center",
                    "text-lg font-bold",
                    "active:scale-95",
                    "disabled:opacity-40 disabled:cursor-not-allowed",
                    estaSelecionada 
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

        {/* Números Selecionados (Preview) */}
        {totalSelecionadas > 0 && (
          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <span className="text-sm font-medium text-muted-foreground">
              Números selecionados:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[...selecionadas].sort((a, b) => a - b).map((numero) => (
                <span
                  key={numero}
                  className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold"
                >
                  {formatarDezena(numero)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Botão Gerar */}
        <Button
          onClick={handleGerarFechamento}
          disabled={!podeGerar}
          className="w-full gap-2"
          size="lg"
        >
          <Sparkles className="h-5 w-5" />
          Gerar {estrategiaAtual.jogos} Jogos
        </Button>

        {/* Informações da Estratégia */}
        <div className="bg-muted/30 rounded-xl p-4 text-center space-y-1">
          <p className="text-sm text-muted-foreground">
            Selecione exatamente <strong className="text-foreground">{estrategiaAtual.dezenas} números</strong> para gerar
          </p>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{estrategiaAtual.jogos} jogos</strong> com garantia de <strong className="text-foreground">{estrategiaAtual.garantia} pontos</strong>
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
