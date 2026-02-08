import { cn } from "@/lib/utils";
import { isPrimo, isMoldura, isMultiploDe3 } from "@/lib/megasena";

interface DezenaDesdobramentoMegaSenaProps {
  numero: number;
  selecionada: boolean;
  fixa: boolean;
  excluida: boolean;
  isRepetida?: boolean;
  onClick: () => void;
}

export function DezenaDesdobramentoMegaSena({
  numero,
  selecionada,
  fixa,
  excluida,
  isRepetida = false,
  onClick,
}: DezenaDesdobramentoMegaSenaProps) {
  const formatNum = (n: number) => n.toString().padStart(2, "0");

  // Definir classes base
  const getClasses = () => {
    if (excluida) {
      return "bg-megasena-excluida text-white border-megasena-excluida";
    }
    if (fixa) {
      return "bg-palpite-fixa text-palpite-fixa-foreground border-palpite-fixa";
    }
    if (selecionada) {
      return "bg-megasena-primary text-megasena-primary-foreground border-megasena-primary";
    }
    return "bg-card border-border hover:border-megasena-primary/50";
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative aspect-square flex items-center justify-center px-3 py-2",
        "text-lg font-bold rounded-lg border-2 transition-all duration-150",
        "active:scale-95",
        getClasses()
      )}
    >
      {formatNum(numero)}
    </button>
  );
}
