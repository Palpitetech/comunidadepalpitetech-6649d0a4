import { cn } from "@/lib/utils";
import { formatarDezena } from "@/lib/lotofacil";

interface DezenaVolanteProps {
  numero: number;
  selecionada: boolean;
  fixa: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function DezenaVolante({ numero, selecionada, fixa, onClick, disabled }: DezenaVolanteProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "aspect-square rounded-lg border-2 transition-all duration-200",
        "flex items-center justify-center",
        "text-lg font-bold",
        "active:scale-95",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        // Estados visuais
        fixa && "bg-amber-100 border-amber-500 text-amber-700 dark:bg-amber-900/30 dark:border-amber-500 dark:text-amber-300",
        selecionada && !fixa && "bg-primary/20 border-primary text-primary",
        !selecionada && !fixa && "bg-card border-border text-foreground hover:border-muted-foreground"
      )}
    >
      {formatarDezena(numero)}
    </button>
  );
}
