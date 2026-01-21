import { cn } from "@/lib/utils";

interface LoteriaBadgeProps {
  tag: string;
  className?: string;
}

const BADGE_STYLES: Record<string, { bg: string; text: string }> = {
  Lotofácil: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300" },
  "Mega-Sena": { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300" },
  Quina: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  Lotomania: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300" },
  Dupla: { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-300" },
};

export function LoteriaBadge({ tag, className }: LoteriaBadgeProps) {
  const style = BADGE_STYLES[tag] || BADGE_STYLES["Lotofácil"];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        style.bg,
        style.text,
        className
      )}
    >
      {tag}
    </span>
  );
}
