import { cn } from "@/lib/utils";
import { Trash2, Check } from "lucide-react";

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
  onDelete?: () => void;
  acertos?: number | null;
  showCheckbox?: boolean;
  showPatterns?: boolean;
}

export function JogoCardDuplaSena({
  index,
  dezenas,
  dezenasFixes = [],
  ultimoConcursoDezenas = [],
  isSelected = false,
  onSelectChange,
  onDelete,
  acertos,
  showCheckbox = true,
  showPatterns = true,
}: JogoCardDuplaSenaProps) {
  const formatDezena = (n: number) => n.toString().padStart(2, "0");

  // Calcular padrões
  const qtdImpares = dezenas.filter(d => d % 2 !== 0).length;
  const qtdRepetidas = ultimoConcursoDezenas.length > 0 
    ? dezenas.filter(d => ultimoConcursoDezenas.includes(d)).length 
    : null;
  const qtdMoldura = dezenas.filter(d => MOLDURA_DUPLASENA.includes(d)).length;
  const qtdPrimos = dezenas.filter(d => PRIMOS_DUPLASENA.includes(d)).length;

  const getAcertosStyle = () => {
    if (acertos === null || acertos === undefined) return "";
    if (acertos >= 6) return "border-amber-400 bg-amber-50 dark:bg-amber-950/30";
    if (acertos >= 5) return "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30";
    if (acertos >= 4) return "border-blue-400 bg-blue-50 dark:bg-blue-950/30";
    return "";
  };

  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-colors",
        getAcertosStyle(),
        isSelected 
          ? "border-duplasena-primary bg-duplasena-primary/5" 
          : "border-border"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {showCheckbox && onSelectChange && (
            <button
              onClick={() => onSelectChange(!isSelected)}
              className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                isSelected
                  ? "bg-duplasena-primary border-duplasena-primary text-white"
                  : "border-muted-foreground/30"
              )}
            >
              {isSelected && <Check className="h-3 w-3" />}
            </button>
          )}
          <span className="text-sm font-medium text-muted-foreground">
            Jogo {index + 1}
          </span>
          {acertos !== null && acertos !== undefined && (
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shrink-0",
                acertos >= 6 && "bg-orange-500 text-white animate-pulse shadow-lg",
                acertos === 5 && "bg-orange-600 text-white",
                acertos === 4 && "bg-orange-700 text-white",
                acertos === 3 && "bg-orange-800 text-orange-50",
                acertos < 3 && "bg-muted text-muted-foreground"
              )}
            >
              {acertos >= 6 && <span>🏆</span>}
              <span>{acertos} pts</span>
            </span>
          )}
        </div>
        {onDelete && (
          <button
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-1.5">
        {dezenas.map((dezena) => (
          <span
            key={dezena}
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold",
              dezenasFixes?.includes(dezena)
                ? "bg-foreground text-background"
                : ultimoConcursoDezenas.includes(dezena)
                ? "bg-duplasena-primary text-white"
                : "bg-duplasena-primary/20 text-duplasena-primary"
            )}
          >
            {formatDezena(dezena)}
          </span>
        ))}
      </div>

      {/* Padrões estatísticos */}
      {showPatterns && (
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
          <span>Ímp: <strong className="text-foreground">{qtdImpares}</strong></span>
          {qtdRepetidas !== null && (
            <span>Rep: <strong className="text-foreground">{qtdRepetidas}</strong></span>
          )}
          <span>Mol: <strong className="text-foreground">{qtdMoldura}</strong></span>
          <span>Pri: <strong className="text-foreground">{qtdPrimos}</strong></span>
        </div>
      )}
    </div>
  );
}
