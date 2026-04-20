import { useState, useMemo } from "react";

export type PeriodKey =
  | "today"
  | "yesterday"
  | "7d"
  | "14d"
  | "21d"
  | "last_month"
  | "1m"
  | "2m"
  | "3m"
  | "custom";

export interface PeriodRange {
  from: Date;
  to: Date;
  label: string;
  key: PeriodKey;
}

export interface CustomRange {
  from?: Date;
  to?: Date;
}

export const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Hoje" },
  { key: "yesterday", label: "Ontem" },
  { key: "7d", label: "7 dias" },
  { key: "14d", label: "14 dias" },
  { key: "21d", label: "21 dias" },
  { key: "last_month", label: "Mês passado" },
  { key: "1m", label: "1 mês" },
  { key: "2m", label: "2 meses" },
  { key: "3m", label: "3 meses" },
  { key: "custom", label: "Personalizado" },
];

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

const subDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() - n);
  return x;
};

const subMonths = (d: Date, n: number) => {
  const x = new Date(d);
  x.setMonth(x.getMonth() - n);
  return x;
};

export function resolvePeriod(key: PeriodKey, custom?: CustomRange): PeriodRange {
  const now = new Date();
  const today = endOfDay(now);

  switch (key) {
    case "today":
      return { from: startOfDay(now), to: today, label: "Hoje", key };
    case "yesterday": {
      const y = subDays(now, 1);
      return { from: startOfDay(y), to: endOfDay(y), label: "Ontem", key };
    }
    case "7d":
      return { from: startOfDay(subDays(now, 6)), to: today, label: "Últimos 7 dias", key };
    case "14d":
      return { from: startOfDay(subDays(now, 13)), to: today, label: "Últimos 14 dias", key };
    case "21d":
      return { from: startOfDay(subDays(now, 20)), to: today, label: "Últimos 21 dias", key };
    case "last_month": {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: startOfDay(first), to: endOfDay(last), label: "Mês passado", key };
    }
    case "1m":
      return { from: startOfDay(subMonths(now, 1)), to: today, label: "Último mês", key };
    case "2m":
      return { from: startOfDay(subMonths(now, 2)), to: today, label: "Últimos 2 meses", key };
    case "3m":
      return { from: startOfDay(subMonths(now, 3)), to: today, label: "Últimos 3 meses", key };
    case "custom": {
      const from = custom?.from ? startOfDay(custom.from) : startOfDay(subDays(now, 6));
      const to = custom?.to ? endOfDay(custom.to) : today;
      return { from, to, label: "Personalizado", key };
    }
  }
}

export function useDashboardPeriod(initialKey: PeriodKey = "7d") {
  const [periodKey, setPeriodKey] = useState<PeriodKey>(initialKey);
  const [customRange, setCustomRange] = useState<CustomRange>({});

  const period = useMemo(
    () => resolvePeriod(periodKey, customRange),
    [periodKey, customRange]
  );

  return {
    period,
    periodKey,
    setPeriodKey,
    customRange,
    setCustomRange,
  };
}
