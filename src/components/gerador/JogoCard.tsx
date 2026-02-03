import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DezenaCirculoMini } from "@/components/lotofacil/DezenaCirculoMini";
import { isPar, isMoldura, isPrimo } from "@/lib/lotofacil";
import { cn } from "@/lib/utils";

interface JogoCardProps {
  numero: number;
  dezenas: number[];
}

export function JogoCard({ numero, dezenas }: JogoCardProps) {
  // Calcular estatísticas do jogo
  const pares = dezenas.filter(isPar).length;
  const impares = 15 - pares;
  const moldura = dezenas.filter(isMoldura).length;
  const primos = dezenas.filter(isPrimo).length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-primary/5">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
            {numero}
          </span>
          Jogo {numero}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Grid de dezenas 5x3 */}
        <div className="grid grid-cols-5 gap-2 justify-items-center">
          {dezenas.map((dezena) => (
            <DezenaCirculoMini
              key={dezena}
              dezena={dezena}
              className={cn(
                isMoldura(dezena) && "ring-2 ring-amber-400/50",
                isPrimo(dezena) && "shadow-md shadow-green-400/30"
              )}
            />
          ))}
        </div>

        {/* Estatísticas do jogo */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border/50">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Pares</div>
            <div className="font-semibold text-blue-600">{pares}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Ímpares</div>
            <div className="font-semibold text-purple-600">{impares}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Moldura</div>
            <div className="font-semibold text-amber-600">{moldura}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Primos</div>
            <div className="font-semibold text-green-600">{primos}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
