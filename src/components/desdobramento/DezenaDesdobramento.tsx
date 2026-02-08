import { cn } from "@/lib/utils";
import { formatarDezena } from "@/lib/lotofacil";

interface DezenaDesdobramentoProps {
  numero: number;
  selecionada: boolean;
  fixa: boolean;
  excluida: boolean;
  isRepetida?: boolean;
  onClick: () => void;
}

export function DezenaDesdobramento({ 
  numero, 
  selecionada, 
  fixa, 
  excluida,
  onClick 
}: DezenaDesdobramentoProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative aspect-square rounded-xl border-2 transition-all duration-200",
        "flex items-center justify-center",
        "text-2xl font-bold",
        "active:scale-95",
        "min-h-[56px]",
        // Estados visuais - ordem de prioridade: excluída > fixa > selecionada > neutro
        excluida && "bg-destructive text-destructive-foreground border-destructive shadow-md",
        fixa && !excluida && "bg-palpite-fixa text-palpite-fixa-foreground border-palpite-fixa shadow-md",
        selecionada && !fixa && !excluida && "bg-palpite-dezena text-palpite-dezena-foreground border-palpite-dezena shadow-md",
        !selecionada && !fixa && !excluida && "bg-card border-border text-foreground hover:border-primary/50 hover:shadow-sm"
      )}
    >
      {formatarDezena(numero)}
    </button>
  );
}
