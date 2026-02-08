import { Copy, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JogoCard } from "./JogoCard";
import { formatarDezena } from "@/lib/lotofacil";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ResultadosFechamentoProps {
  jogos: number[][];
  onNovoFechamento: () => void;
}

export function ResultadosFechamento({ jogos, onNovoFechamento }: ResultadosFechamentoProps) {
  const [copiado, setCopiado] = useState(false);
  const { toast } = useToast();

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

      {/* Lista de jogos */}
      <div className="grid gap-3">
        {jogos.map((jogo, index) => (
          <JogoCard key={index} jogo={jogo} index={index} />
        ))}
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
