import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SeletorPeriodoProps {
  periodos: number[];
  selecionado: number;
  onChange: (periodo: number) => void;
}

export function SeletorPeriodo({
  periodos,
  selecionado,
  onChange,
}: SeletorPeriodoProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {periodos.map((periodo) => (
        <Button
          key={periodo}
          variant={selecionado === periodo ? "default" : "secondary"}
          size="lg"
          onClick={() => onChange(periodo)}
          className={cn(
            "min-w-[52px] text-lg font-semibold shrink-0",
            selecionado === periodo && "shadow-md"
          )}
        >
          {periodo}
        </Button>
      ))}
    </div>
  );
}
