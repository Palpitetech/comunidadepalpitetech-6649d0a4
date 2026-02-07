import { cn } from "@/lib/utils";
import { formatarDezena, isImpar, isMoldura, isMultiploDe3 } from "@/lib/lotofacil";

interface DezenaVolanteProps {
  numero: number;
  selecionada: boolean;
  fixa: boolean;
  isRepetida?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function DezenaVolante({ numero, selecionada, fixa, isRepetida, onClick, disabled }: DezenaVolanteProps) {
  const impar = isImpar(numero);
  const moldura = isMoldura(numero);
  const multiploDe3 = isMultiploDe3(numero);

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
        <span className="absolute top-0.5 left-1 text-[8px] font-bold text-muted-foreground">
          I
        </span>
      )}

      {/* Indicador Repetida - Canto superior direito */}
      {isRepetida && (
        <span className="absolute top-0.5 right-1 text-[8px] font-bold text-muted-foreground">
          R
        </span>
      )}

      {/* Número central */}
      {formatarDezena(numero)}

      {/* Indicador Moldura - Canto inferior esquerdo */}
      {moldura && (
        <span className="absolute bottom-0.5 left-1 text-[8px] font-bold text-muted-foreground">
          M
        </span>
      )}

      {/* Indicador Múltiplo de 3 - Canto inferior direito */}
      {multiploDe3 && (
        <span className="absolute bottom-0.5 right-1 text-[7px] font-bold text-muted-foreground">
          M3
        </span>
      )}
    </button>
  );
}
