import { cn } from "@/lib/utils";
import { formatarDezena, isPar, isImpar, isMoldura, isMultiploDe3 } from "@/lib/lotofacil";

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

  const isActive = selecionada || fixa;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative aspect-square rounded-xl border-2 transition-all duration-200",
        "flex items-center justify-center",
        "text-xl font-bold",
        "active:scale-95",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        // Estados visuais
        fixa && "bg-palpite-fixa text-palpite-fixa-foreground border-palpite-fixa shadow-md",
        selecionada && !fixa && "bg-palpite-dezena text-palpite-dezena-foreground border-palpite-dezena shadow-md",
        !selecionada && !fixa && "bg-card border-border text-foreground hover:border-primary/50 hover:shadow-sm"
      )}
    >
      {/* Indicador Ímpar - Canto superior esquerdo */}
      {impar && (
        <span className={cn(
          "absolute top-0.5 left-0.5 w-4 h-4 flex items-center justify-center",
          "text-[8px] font-bold rounded-full",
          isActive 
            ? "bg-white/20 text-white/90" 
            : "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
        )}>
          I
        </span>
      )}

      {/* Indicador Par - Canto superior direito */}
      {par && (
        <span className={cn(
          "absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center",
          "text-[8px] font-bold rounded-full",
          isActive 
            ? "bg-white/20 text-white/90" 
            : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        )}>
          P
        </span>
      )}

      {/* Número central */}
      {formatarDezena(numero)}

      {/* Indicador Moldura - Canto inferior esquerdo */}
      {moldura && (
        <span className={cn(
          "absolute bottom-0.5 left-0.5 w-4 h-4 flex items-center justify-center",
          "text-[8px] font-bold rounded-full",
          isActive 
            ? "bg-white/20 text-white/90" 
            : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        )}>
          M
        </span>
      )}

      {/* Indicador Múltiplo de 3 - Canto inferior direito */}
      {multiploDe3 && (
        <span className={cn(
          "absolute bottom-0.5 right-0.5 w-5 h-4 flex items-center justify-center",
          "text-[7px] font-bold rounded-full",
          isActive 
            ? "bg-white/20 text-white/90" 
            : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
        )}>
          M3
        </span>
      )}
    </button>
  );
}
