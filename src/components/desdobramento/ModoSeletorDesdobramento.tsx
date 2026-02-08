import { cn } from "@/lib/utils";

interface ModoSeletorDesdobramentoProps {
  modo: "selecionar" | "fixar" | "excluir";
  onChange: (modo: "selecionar" | "fixar" | "excluir") => void;
}

export function ModoSeletorDesdobramento({ modo, onChange }: ModoSeletorDesdobramentoProps) {
  return (
    <div className="flex items-center justify-center gap-0.5 p-0.5 bg-muted rounded-lg">
      <button
        type="button"
        onClick={() => onChange("selecionar")}
        className={cn(
          "flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all",
          modo === "selecionar"
            ? "bg-palpite-dezena text-palpite-dezena-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Selecionar
      </button>
      <button
        type="button"
        onClick={() => onChange("fixar")}
        className={cn(
          "flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all",
          modo === "fixar"
            ? "bg-palpite-fixa text-palpite-fixa-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Fixar
      </button>
      <button
        type="button"
        onClick={() => onChange("excluir")}
        className={cn(
          "flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all",
          modo === "excluir"
            ? "bg-destructive text-destructive-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Excluir
      </button>
    </div>
  );
}
