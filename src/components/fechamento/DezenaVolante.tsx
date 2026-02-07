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

  // Define text colors for indicators based on state
  const indicatorClass = cn(
    "text-[9px] font-semibold",
    fixa ? "text-white/70" : selecionada ? "text-white/70" : "text-muted-foreground"
  );

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative aspect-square rounded-lg border-2 transition-all duration-200",
        "flex items-center justify-center",
        "text-lg font-bold",
        "active:scale-95",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        // Estados visuais
        fixa && "bg-palpite-fixa text-palpite-fixa-foreground border-palpite-fixa",
        selecionada && !fixa && "bg-palpite-dezena text-palpite-dezena-foreground border-palpite-dezena",
        !selecionada && !fixa && "bg-card border-border text-foreground hover:border-muted-foreground"
      )}
    >
      {/* Indicador Ímpar - Canto superior esquerdo */}
      {impar && (
        <span className={cn("absolute top-0.5 left-1", indicatorClass)}>
          I
        </span>
      )}

      {/* Indicador Par - Canto superior direito */}
      {par && (
        <span className={cn("absolute top-0.5 right-1", indicatorClass)}>
          P
        </span>
      )}

      {/* Número central */}
      {formatarDezena(numero)}

      {/* Indicador Moldura - Canto inferior esquerdo */}
      {moldura && (
        <span className={cn("absolute bottom-0.5 left-1", indicatorClass)}>
          M
        </span>
      )}

      {/* Indicador Múltiplo de 3 - Canto inferior direito */}
      {multiploDe3 && (
        <span className={cn("absolute bottom-0.5 right-1", indicatorClass)}>
          M3
        </span>
      )}
    </button>
  );
}
