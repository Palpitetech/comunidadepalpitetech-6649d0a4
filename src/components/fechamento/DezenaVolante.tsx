import { cn } from "@/lib/utils";
import { isPar, isImpar, isMoldura, isMultiploDe3, formatarDezena } from "@/lib/lotofacil";

interface DezenaVolanteProps {
  numero: number;
  selecionada: boolean;
  fixa: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function DezenaVolante({ numero, selecionada, fixa, onClick, disabled }: DezenaVolanteProps) {
  const par = isPar(numero);
  const impar = isImpar(numero);
  const moldura = isMoldura(numero);
  const multiploDe3 = isMultiploDe3(numero);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative aspect-square rounded-lg border-2 transition-all duration-200",
        "flex items-center justify-center",
        "text-xl font-bold",
        "hover:scale-105 active:scale-95",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
        // Estados visuais
        fixa && "bg-amber-100 border-amber-500 dark:bg-amber-900/30 dark:border-amber-500",
        selecionada && !fixa && "bg-primary/20 border-primary",
        !selecionada && !fixa && "bg-card border-border hover:border-muted-foreground"
      )}
    >
      {/* Indicador Ímpar - Canto superior esquerdo */}
      {impar && (
        <span className="absolute top-0.5 left-1 text-[10px] font-semibold text-purple-600 dark:text-purple-400">
          I
        </span>
      )}

      {/* Indicador Par - Canto superior direito */}
      {par && (
        <span className="absolute top-0.5 right-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
          P
        </span>
      )}

      {/* Número central */}
      <span className={cn(
        "text-foreground",
        fixa && "text-amber-700 dark:text-amber-300",
        selecionada && !fixa && "text-primary"
      )}>
        {formatarDezena(numero)}
      </span>

      {/* Indicador Moldura - Canto inferior esquerdo */}
      {moldura && (
        <span className="absolute bottom-0.5 left-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
          M
        </span>
      )}

      {/* Indicador Múltiplo de 3 - Canto inferior direito */}
      {multiploDe3 && (
        <span className="absolute bottom-0.5 right-1 text-[10px] font-semibold text-green-600 dark:text-green-400">
          M3
        </span>
      )}
    </button>
  );
}
