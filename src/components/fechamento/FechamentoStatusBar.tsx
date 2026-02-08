interface FechamentoStatusBarProps {
  total: number;
  selecionados: number;
  fixos: number;
}

export function FechamentoStatusBar({ total, selecionados, fixos }: FechamentoStatusBarProps) {
  return (
    <div className="flex items-center justify-center gap-4 text-sm font-medium">
      <span className="text-muted-foreground">Total: <strong className="text-foreground">{total}</strong></span>
      <span className="text-border">|</span>
      <span className="text-muted-foreground">Selecionados: <strong className="text-foreground">{selecionados}</strong></span>
      <span className="text-border">|</span>
      <span className="text-muted-foreground">Fixos: <strong className="text-foreground">{fixos}</strong></span>
    </div>
  );
}
