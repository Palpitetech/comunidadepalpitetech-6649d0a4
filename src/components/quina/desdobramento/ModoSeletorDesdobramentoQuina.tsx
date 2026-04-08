import { cn } from "@/lib/utils";
import { Lock, X } from "lucide-react";

interface ModoSeletorDesdobramentoQuinaProps {
  modo: "fixar" | "excluir";
  onModoChange: (modo: "fixar" | "excluir") => void;
  qtdFixas: number;
  qtdExcluidas: number;
}

export function ModoSeletorDesdobramentoQuina({
  modo,
  onModoChange,
  qtdFixas,
  qtdExcluidas,
}: ModoSeletorDesdobramentoQuinaProps) {
  return (
    <div className="flex gap-2 p-1 bg-muted rounded-lg">
      <button
        type="button"
        onClick={() => onModoChange("fixar")}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-all",
          modo === "fixar"
            ? "bg-palpite-fixa text-palpite-fixa-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Lock className="h-4 w-4" />
        <span>Fixar</span>
        {qtdFixas > 0 && (
          <span className="ml-1 text-xs bg-background/30 px-1.5 py-0.5 rounded">
            {qtdFixas}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => onModoChange("excluir")}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-all",
          modo === "excluir"
            ? "bg-destructive text-destructive-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <X className="h-4 w-4" />
        <span>Excluir</span>
        {qtdExcluidas > 0 && (
          <span className="ml-1 text-xs bg-background/30 px-1.5 py-0.5 rounded">
            {qtdExcluidas}
          </span>
        )}
      </button>
    </div>
  );
}
