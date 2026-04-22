import { ComponentType } from "react";

export type Tone = "success" | "warning" | "error" | "muted" | "info";

export function toneClass(tone: Tone, active = false): string {
  const ring = active ? "ring-2 ring-offset-1 ring-offset-background " : "";
  switch (tone) {
    case "success":
      return ring + (active ? "ring-green-500/50 " : "") + "bg-green-500/10 border-green-500/30 text-green-700";
    case "error":
      return ring + (active ? "ring-red-500/50 " : "") + "bg-red-500/10 border-red-500/30 text-red-700";
    case "info":
      return ring + (active ? "ring-blue-500/50 " : "") + "bg-blue-500/10 border-blue-500/30 text-blue-700";
    case "warning":
      return ring + (active ? "ring-amber-500/50 " : "") + "bg-amber-500/10 border-amber-500/30 text-amber-700";
    default:
      return ring + (active ? "ring-foreground/30 " : "") + "bg-muted/40 border-border text-muted-foreground";
  }
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
  active = false,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: Tone;
  active?: boolean;
  onClick?: () => void;
}) {
  const cls = `rounded-lg border p-3 text-left transition-all ${toneClass(tone, active)}`;
  const inner = (
    <>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl sm:text-2xl font-bold tabular-nums">{value}</p>
    </>
  );
  if (onClick) {
    return (
      <button onClick={onClick} className={cls}>
        {inner}
      </button>
    );
  }
  return <div className={cls}>{inner}</div>;
}
