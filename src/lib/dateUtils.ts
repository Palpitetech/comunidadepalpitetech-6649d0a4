// Utilities for formatting dates in Brazil timezone (BRT, America/Sao_Paulo)

/**
 * Formats an ISO timestamp in BRT.
 * Returns: "hoje às 23:01", "ontem às 14:32", or "12/03 às 09:15".
 */
export function formatBRT(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "—";

  const fmt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const toMap = (date: Date) =>
    fmt.formatToParts(date).reduce<Record<string, string>>((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});

  const parts = toMap(d);
  const today = toMap(new Date());
  const yesterday = toMap(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const time = `${parts.hour}:${parts.minute}`;

  if (parts.day === today.day && parts.month === today.month) {
    return `hoje às ${time}`;
  }
  if (parts.day === yesterday.day && parts.month === yesterday.month) {
    return `ontem às ${time}`;
  }
  return `${parts.day}/${parts.month} às ${time}`;
}

/** Returns "agora" / "há X min" / "há Xh" / "há Xd" relative to now. */
export function timeAgoBRT(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "—";
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return "agora";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `há ${diffD}d`;
}

/** Current hour (0-23) in BRT. */
export function currentHourBRT(): number {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    hour12: false,
  });
  return parseInt(fmt.format(new Date()), 10);
}

/** Today's date as YYYY-MM-DD in BRT. */
export function todayBRT(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

/** Returns YYYY-MM-DD in BRT for a given ISO string. */
export function toBRTDate(isoString: string | null | undefined): string | null {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return null;
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(d);
}
