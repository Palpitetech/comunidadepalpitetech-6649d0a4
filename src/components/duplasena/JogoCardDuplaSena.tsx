import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Dupla Sena: 1-50, grid 5x10
const PRIMOS_DUPLASENA = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
const MOLDURA_DUPLASENA = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, // top row
  11, 20, // sides row 2
  21, 30, // sides row 3
  31, 40, // sides row 4
  41, 42, 43, 44, 45, 46, 47, 48, 49, 50 // bottom row
];

interface JogoCardDuplaSenaProps {
  index: number;
  dezenas: number[];
  dezenasFixes?: number[];
  ultimoConcursoDezenas?: number[];
  isSelected?: boolean;
  onSelectChange?: (checked: boolean) => void;
  acertos?: number | null;
  showPatterns?: boolean;
}

export function JogoCardDuplaSena({
  index,
  dezenas,
  dezenasFixes = [],
  ultimoConcursoDezenas = [],
  isSelected = false,
  onSelectChange,
  acertos,
  showPatterns = true,
}: JogoCardDuplaSenaProps) {
  const formatNum = (n: number) => n.toString().padStart(2, "0");

  // Calculate patterns
  const qtdImpares = dezenas.filter(d => d % 2 !== 0).length;
  const qtdRepetidas = dezenas.filter(d => ultimoConcursoDezenas.includes(d)).length;
  const qtdMoldura = dezenas.filter(d => MOLDURA_DUPLASENA.includes(d)).length;
  const qtdPrimos = dezenas.filter(d => PRIMOS_DUPLASENA.includes(d)).length;

  return (
    <Card className={cn(
      "transition-all duration-200",
      isSelected && "ring-2 ring-duplasena-primary"
    )}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          {onSelectChange && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelectChange}
              className="mt-1 data-[state=checked]:bg-duplasena-primary data-[state=checked]:border-duplasena-primary"
            />
          )}
          
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Jogo {index + 1}
              </span>
              {acertos !== null && acertos !== undefined && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-xs",
                    acertos >= 6 && "bg-yellow-500 text-yellow-950",
                    acertos === 5 && "bg-emerald-500 text-white",
                    acertos === 4 && "bg-blue-500 text-white",
                    acertos === 3 && "bg-purple-500 text-white"
                  )}
                >
                  {acertos} acertos
                </Badge>
              )}
            </div>
            
            {/* Dezenas */}
            <div className="flex flex-wrap gap-1.5">
              {dezenas.map((dezena) => {
                const isFixa = dezenasFixes.includes(dezena);
                
                return (
                  <span
                    key={dezena}
                    className={cn(
                      "inline-flex items-center justify-center w-8 h-8 text-sm font-bold rounded-lg",
                      isFixa
                        ? "bg-palpite-fixa text-palpite-fixa-foreground"
                        : "bg-duplasena-primary/15 text-duplasena-primary border border-duplasena-primary/30"
                    )}
                  >
                    {formatNum(dezena)}
                  </span>
                );
              })}
            </div>

            {/* Pattern Statistics */}
            {showPatterns && (
              <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-border/50">
                <span className="text-[10px] text-muted-foreground">
                  <span className="font-medium">Ímp:</span> {qtdImpares}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  <span className="font-medium">Rep:</span> {qtdRepetidas}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  <span className="font-medium">Mol:</span> {qtdMoldura}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  <span className="font-medium">Pri:</span> {qtdPrimos}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}