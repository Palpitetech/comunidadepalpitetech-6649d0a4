// Shared visual health status helpers for the Monitor Grupos panel.

export type HealthStatus = "ok" | "warn" | "critical" | "neutral";

export interface HealthStyle {
  badgeClass: string;
  borderClass: string;
  label: string;
}

const STYLES: Record<HealthStatus, HealthStyle> = {
  ok: {
    badgeClass: "bg-green-100 text-green-800 border border-green-200",
    borderClass: "border-l-green-500",
    label: "OK",
  },
  warn: {
    badgeClass: "bg-orange-100 text-orange-800 border border-orange-200",
    borderClass: "border-l-orange-500",
    label: "Atenção",
  },
  critical: {
    badgeClass: "bg-red-100 text-red-800 border border-red-200",
    borderClass: "border-l-red-500",
    label: "Crítico",
  },
  neutral: {
    badgeClass: "bg-muted text-muted-foreground border border-border",
    borderClass: "border-l-muted",
    label: "—",
  },
};

export function getHealthStyle(status: HealthStatus): HealthStyle {
  return STYLES[status];
}

/**
 * Generic threshold helper.
 * - value <= warn => ok
 * - warn < value <= critical => warn
 * - value > critical => critical
 */
export function getHealthByThreshold(
  value: number,
  thresholds: { warn: number; critical: number },
): HealthStatus {
  if (value > thresholds.critical) return "critical";
  if (value > thresholds.warn) return "warn";
  return "ok";
}
