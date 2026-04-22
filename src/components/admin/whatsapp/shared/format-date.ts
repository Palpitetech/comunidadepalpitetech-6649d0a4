import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export type DatePreset = "short" | "full" | "time";

const PATTERNS: Record<DatePreset, string> = {
  short: "dd/MM HH:mm",
  full: "dd/MM/yy HH:mm",
  time: "HH:mm",
};

export function fmtDate(d: string | Date | null | undefined, preset: DatePreset = "short"): string {
  if (!d) return "—";
  try {
    return format(typeof d === "string" ? new Date(d) : d, PATTERNS[preset], { locale: ptBR });
  } catch {
    return "—";
  }
}
