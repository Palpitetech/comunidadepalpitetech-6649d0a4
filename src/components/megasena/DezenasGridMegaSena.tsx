import { cn } from "@/lib/utils";

interface DezenasGridMegaSenaProps {
  dezenasFiexas: number[];
  dezenasExcluidas: number[];
  onToggleDezena: (dezena: number) => void;
  modo: "fixar" | "excluir";
  disabled?: boolean;
  ultimoConcursoDezenas?: number[];
}

export function DezenasGridMegaSena({
  dezenasFiexas,
  dezenasExcluidas,
  onToggleDezena,
  modo,
  disabled = false,
  ultimoConcursoDezenas = [],
}: DezenasGridMegaSenaProps) {
  const formatDezena = (n: number) => n.toString().padStart(2, "0");

  const getDezenaCor = (dezena: number) => {
    if (dezenasFiexas.includes(dezena)) {
      return "bg-foreground text-background border-foreground";
    }
    if (dezenasExcluidas.includes(dezena)) {
      return "bg-destructive text-destructive-foreground border-destructive";
    }
    if (ultimoConcursoDezenas.includes(dezena)) {
      return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500";
    }
    return "bg-background border-border hover:border-primary/50";
  };

  return (
    <div className="grid grid-cols-10 gap-1.5">
      {Array.from({ length: 60 }, (_, i) => i + 1).map((dezena) => {
        const isFixa = dezenasFiexas.includes(dezena);
        const isExcluida = dezenasExcluidas.includes(dezena);
        
        return (
          <button
            key={dezena}
            type="button"
            disabled={disabled}
            onClick={() => onToggleDezena(dezena)}
            className={cn(
              "aspect-square flex items-center justify-center rounded-md text-sm font-semibold border-2 transition-all",
              getDezenaCor(dezena),
              disabled && "opacity-50 cursor-not-allowed",
              !disabled && "cursor-pointer"
            )}
          >
            {formatDezena(dezena)}
          </button>
        );
      })}
    </div>
  );
}
