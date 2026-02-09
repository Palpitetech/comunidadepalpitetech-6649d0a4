import { cn } from "@/lib/utils";

interface DezenaDesdobramentoDuplaSenaProps {
  numero: number;
  selecionada: boolean;
  fixa: boolean;
  excluida: boolean;
  isRepetida?: boolean;
  onClick: () => void;
}

export function DezenaDesdobramentoDuplaSena({
  numero,
  selecionada,
  fixa,
  excluida,
  isRepetida = false,
  onClick,
}: DezenaDesdobramentoDuplaSenaProps) {
  const formatNum = (n: number) => n.toString().padStart(2, "0");

  // Definir classes base
  const getClasses = () => {
    if (excluida) {
      return "bg-duplasena-excluida text-white border-duplasena-excluida";
    }
    if (fixa) {
      return "bg-palpite-fixa text-palpite-fixa-foreground border-palpite-fixa";
    }
    if (selecionada) {
      return "bg-duplasena-primary text-duplasena-primary-foreground border-duplasena-primary";
    }
    return "bg-card border-border hover:border-duplasena-primary/50";
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
