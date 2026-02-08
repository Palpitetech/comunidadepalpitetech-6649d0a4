import { cn } from "@/lib/utils";

interface FechamentoStatusBarProps {
  total: number;
  selecionados: number;
  fixos: number;
}

export function FechamentoStatusBar({ total, selecionados, fixos }: FechamentoStatusBarProps) {
  const faltam = total - selecionados - fixos;
  const completo = faltam <= 0;

  return (
    <div className="flex items-center justify-center gap-4 py-3 px-4 bg-muted/50 rounded-lg text-sm">
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Total:</span>
        <span className="font-bold text-foreground">{total}</span>
      </div>
      
      <div className="w-px h-4 bg-border" />
      
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Selecionados:</span>
        <span className={cn(
          "font-bold",
          completo ? "text-primary" : "text-foreground"
        )}>
          {selecionados}
        </span>
      </div>
      
      <div className="w-px h-4 bg-border" />
      
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Fixos:</span>
        <span className="font-bold text-foreground">{fixos}</span>
      </div>

      {!completo && (
        <>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Faltam:</span>
            <span className="font-bold text-destructive">{faltam}</span>
          </div>
        </>
      )}
    </div>
  );
}
