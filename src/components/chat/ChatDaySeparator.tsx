import { format, isToday, isYesterday, parseISO } from "date-fns";

interface ChatDaySeparatorProps {
  date: string; // ISO
}

export function ChatDaySeparator({ date }: ChatDaySeparatorProps) {
  const d = parseISO(date);
  const label = isToday(d) ? "Hoje" : isYesterday(d) ? "Ontem" : format(d, "dd/MM/yyyy");

  return (
    <div className="flex justify-center py-2">
      <div className="rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm">
        {label}
      </div>
    </div>
  );
}
