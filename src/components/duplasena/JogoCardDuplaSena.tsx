import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface JogoCardDuplaSenaProps {
  index: number;
  dezenas: number[];
  dezenasFixes?: number[];
  ultimoConcursoDezenas?: number[];
  isSelected?: boolean;
  onSelectChange?: (checked: boolean) => void;
  acertos?: number | null;
}

export function JogoCardDuplaSena({
  index,
  dezenas,
  dezenasFixes = [],
  ultimoConcursoDezenas = [],
  isSelected = false,
  onSelectChange,
  acertos,
}: JogoCardDuplaSenaProps) {
  const formatNum = (n: number) => n.toString().padStart(2, "0");

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
                const isRepetida = ultimoConcursoDezenas.includes(dezena);
                
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
