import { cn } from "@/lib/utils";

interface ModoSeletorFixasProps {
  modo: "selecionar" | "fixar";
  onChange: (modo: "selecionar" | "fixar") => void;
}

export function ModoSeletorFixas({ modo, onChange }: ModoSeletorFixasProps) {
  return (
    <div className="flex items-center justify-center gap-1 p-1 bg-muted rounded-lg">
      <button
        type="button"
        onClick={() => onChange("selecionar")}
        className={cn(
          "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
          modo === "selecionar"
            ? "bg-palpite-dezena text-palpite-dezena-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Seletor
      </button>
      <button
        type="button"
        onClick={() => onChange("fixar")}
        className={cn(
          "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
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
