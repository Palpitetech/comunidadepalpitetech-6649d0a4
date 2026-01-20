import { cn } from "@/lib/utils";

interface DezenaCirculoMiniProps {
  dezena: number;
  className?: string;
}

export function DezenaCirculoMini({ dezena, className }: DezenaCirculoMiniProps) {
  return (
    <div
      className={cn(
        "w-[30px] h-[30px] rounded-full flex items-center justify-center",
        "bg-primary/10 text-primary",
        "text-sm font-semibold",
        className
      )}
    >
      {dezena.toString().padStart(2, "0")}
    </div>
  );
}
