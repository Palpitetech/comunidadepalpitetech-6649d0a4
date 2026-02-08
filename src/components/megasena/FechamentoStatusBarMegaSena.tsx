import { cn } from "@/lib/utils";

interface FechamentoStatusBarMegaSenaProps {
  total: number;
  selecionados: number;
  fixos: number;
}

export function FechamentoStatusBarMegaSena({ 
  total, 
  selecionados, 
  fixos 
}: FechamentoStatusBarMegaSenaProps) {
  const totalMarcados = selecionados + fixos;
  const faltam = total - totalMarcados;
  const completo = totalMarcados === total;

  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg border transition-colors",
      completo 
        ? "border-emerald-500/50 bg-emerald-500/10" 
        : "border-border bg-muted/30"
    )}>
      <div className="flex items-center gap-4 text-sm">
        <span>
          <strong className="text-foreground">{selecionados}</strong>
          <span className="text-muted-foreground"> selecionadas</span>
        </span>
        {fixos > 0 && (
          <span>
            <strong className="text-foreground">{fixos}</strong>
            <span className="text-muted-foreground"> fixas</span>
          </span>
        )}
      </div>
      <div className={cn(
        "text-sm font-medium",
        completo ? "text-emerald-500" : "text-muted-foreground"
      )}>
        {completo ? "Pronto!" : `Faltam ${faltam}`}
      </div>
    </div>
  );
}
