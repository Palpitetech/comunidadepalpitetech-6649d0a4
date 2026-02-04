import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface Jogo {
  dezenas: number[];
}

interface JogoListaProps {
  jogos: Jogo[];
}

export function JogoLista({ jogos }: JogoListaProps) {
  const [copied, setCopied] = useState(false);

  const formatDezenas = (dezenas: number[]) => {
    return dezenas.map(d => d.toString().padStart(2, '0')).join('-');
  };

  const handleCopy = async () => {
    const text = jogos
      .map((jogo, i) => `Jogo ${i + 1}: ${formatDezenas(jogo.dezenas)}`)
      .join('\n');
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Palpites copiados!",
        description: `${jogos.length} jogo(s) copiado(s) para a área de transferência.`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar os palpites.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Seus Palpites</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {jogos.map((jogo, index) => (
          <div
            key={index}
            className="p-3 bg-secondary rounded-lg border border-border"
          >
            <span className="font-semibold text-primary">Jogo {index + 1}:</span>{" "}
            <span className="text-foreground font-mono text-sm break-all">
              {formatDezenas(jogo.dezenas)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
