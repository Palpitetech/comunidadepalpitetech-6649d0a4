interface FechamentoStatusBarProps {
  total: number;
  selecionados: number;
  fixos: number;
}

export function FechamentoStatusBar({ total, selecionados, fixos }: FechamentoStatusBarProps) {
  return (
    <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
      <span>Total: <strong className="text-foreground">{total}</strong></span>
      <span>•</span>
      <span>Selecionados: <strong className="text-foreground">{selecionados}</strong></span>
      <span>•</span>
      <span>Fixos: <strong className="text-foreground">{fixos}</strong></span>
    </div>
  );
}
