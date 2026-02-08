import { cn } from "@/lib/utils";

interface ModoSeletorFixasMegaSenaProps {
  modo: "selecionar" | "fixar";
  onChange: (modo: "selecionar" | "fixar") => void;
}

export function ModoSeletorFixasMegaSena({ modo, onChange }: ModoSeletorFixasMegaSenaProps) {
  return (
    <div className="flex items-center justify-center gap-0.5 p-0.5 bg-muted rounded-lg flex-1 min-w-0">
      <button
        type="button"
        onClick={() => onChange("selecionar")}
        className={cn(
          "flex-1 py-1.5 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-all",
          modo === "selecionar"
            ? "bg-megasena-primary text-megasena-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Seletor
      </button>
      <button
        type="button"
        onClick={() => onChange("fixar")}
        className={cn(
          "flex-1 py-1.5 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-all",
          modo === "fixar"
            ? "bg-palpite-fixa text-palpite-fixa-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Fixas
      </button>
    </div>
  );
}
