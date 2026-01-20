import { cn } from "@/lib/utils";

interface DezenaCirculoMiniProps {
  dezena: number;
  className?: string;
}

export function DezenaCirculoMini({ dezena, className }: DezenaCirculoMiniProps) {
  return (
    <div
      className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center",
        "bg-white border border-primary/30 text-primary",
        "text-sm font-semibold",
        className
      )}
    >
      {dezena.toString().padStart(2, "0")}
    </div>
  );
}
