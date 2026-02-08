import { Copy, Check, RotateCcw, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PalpiteCard } from "@/components/shared/PalpiteCard";
import { formatarDezena } from "@/lib/lotofacil";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ResultadosFechamentoProps {
  jogos: number[][];
  fixas?: number[];
  onNovoFechamento: () => void;
}

export function ResultadosFechamento({ jogos, fixas = [], onNovoFechamento }: ResultadosFechamentoProps) {
  const [copiado, setCopiado] = useState(false);
  const [ultimoConcurso, setUltimoConcurso] = useState<number[]>([]);
  const { toast } = useToast();

  // Carregar último concurso para estatísticas de repetidas
  useEffect(() => {
    const carregarUltimoConcurso = async () => {
      const { data } = await supabase
        .from("resultados")
        .select("dezenas")
        .order("concurso_id", { ascending: false })
        .limit(1)
        .single();
      
      if (data?.dezenas) {
        setUltimoConcurso(data.dezenas);
      }
    };
    carregarUltimoConcurso();
  }, []);

  const handleCopiarTodos = async () => {
    const texto = jogos
      .map((jogo, i) => {
        const dezenasOrdenadas = [...jogo].sort((a, b) => a - b);
        return `Jogo ${i + 1}: ${dezenasOrdenadas.map(formatarDezena).join(" - ")}`;
      })
      .join("\n");

    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      toast({
        title: "Jogos copiados!",
        description: `${jogos.length} jogos copiados para a área de transferência.`,
      });
      setTimeout(() => setCopiado(false), 2000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar os jogos.",
        variant: "destructive",
      });
    }
  };

  const handleCopiarJogo = async (jogo: number[], index: number) => {
    const dezenasOrdenadas = [...jogo].sort((a, b) => a - b);
    const texto = dezenasOrdenadas.map(formatarDezena).join(" - ");

    try {
      await navigator.clipboard.writeText(texto);
      toast({
        title: `Jogo ${index + 1} copiado!`,
        description: texto,
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o jogo.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Jogos Gerados</h3>
          <p className="text-sm text-muted-foreground">
            {jogos.length} jogos prontos para apostar
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopiarTodos}
            className="gap-1.5"
          >
            {copiado ? (
              <>
                <Check className="h-4 w-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar Todos
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Lista de jogos usando PalpiteCard universal */}
      <div className="grid gap-3">
        {jogos.map((jogo, index) => {
          // Ordena as dezenas para exibição
          const dezenasOrdenadas = [...jogo].sort((a, b) => a - b);
          
          return (
            <PalpiteCard
              key={index}
              index={index}
              dezenas={dezenasOrdenadas}
              dezenasFixes={fixas}
              ultimoConcursoDezenas={ultimoConcurso}
              hideSelection
              onCopy={() => handleCopiarJogo(jogo, index)}
            />
          );
        })}
      </div>

      {/* Botão de novo fechamento */}
      <Button
        variant="outline"
        onClick={onNovoFechamento}
        className="w-full gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        Novo Fechamento
      </Button>
    </div>
  );
}
