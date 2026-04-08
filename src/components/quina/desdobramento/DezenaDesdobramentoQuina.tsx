import { cn } from "@/lib/utils";

interface DezenaDesdobramentoQuinaProps {
  numero: number;
  selecionada: boolean;
  fixa: boolean;
  excluida: boolean;
  isRepetida?: boolean;
  onClick: () => void;
}

export function DezenaDesdobramentoQuina({
  numero,
  fixa,
  excluida,
  onClick,
}: DezenaDesdobramentoQuinaProps) {
  const formatNum = (n: number) => n.toString().padStart(2, "0");

  const getClasses = () => {
    if (excluida) {
      return "bg-destructive text-destructive-foreground border-destructive";
    }
    if (fixa) {
      return "bg-palpite-fixa text-palpite-fixa-foreground border-palpite-fixa";
    }
    return "bg-card border-border hover:border-primary/50";
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative aspect-square flex items-center justify-center",
        "text-sm font-bold rounded-lg border-2 transition-all duration-150",
        "active:scale-95",
        getClasses()
      )}
    >
      {formatNum(numero)}
    </button>
  );
}
