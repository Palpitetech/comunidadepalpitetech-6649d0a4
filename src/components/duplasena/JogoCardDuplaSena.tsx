import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Check } from "lucide-react";

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
}: JogoCardDuplaSenaProps) {
  const formatDezena = (n: number) => n.toString().padStart(2, "0");

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
                "text-xs font-bold px-2 py-0.5 rounded-full",
                acertos >= 6 && "bg-amber-500 text-white",
                acertos === 5 && "bg-emerald-500 text-white",
                acertos === 4 && "bg-blue-500 text-white",
                acertos < 4 && "bg-muted text-muted-foreground"
              )}
            >
              {acertos}pt
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
    </div>
  );
}
