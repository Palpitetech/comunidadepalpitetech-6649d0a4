import { cn } from "@/lib/utils";
import { Lock, Ban } from "lucide-react";

interface ModoSeletorDesdobramentoMegaSenaProps {
  modo: "fixar" | "excluir";
  onChange: (modo: "fixar" | "excluir") => void;
}

export function ModoSeletorDesdobramentoMegaSena({
  modo,
  onChange,
}: ModoSeletorDesdobramentoMegaSenaProps) {
  return (
    <div className="flex rounded-lg border p-1 bg-muted/30">
      <button
        type="button"
        onClick={() => onChange("fixar")}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
          modo === "fixar"
            ? "bg-palpite-fixa text-palpite-fixa-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Lock className="h-4 w-4" />
        Fixar
      </button>
      <button
        type="button"
        onClick={() => onChange("excluir")}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
          modo === "excluir"
            ? "bg-megasena-excluida text-white shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Ban className="h-4 w-4" />
        Excluir
      </button>
    </div>
  );
}
