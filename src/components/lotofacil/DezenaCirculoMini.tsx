import { cn } from "@/lib/utils";

interface DezenaCirculoMiniProps {
  dezena: number;
  className?: string;
  isSelected?: boolean;
}

export function DezenaCirculoMini({ dezena, className, isSelected }: DezenaCirculoMiniProps) {
  return (
    <div
      className={cn(
        "w-[30px] h-[30px] rounded-full flex items-center justify-center",
        "text-sm font-semibold",
        isSelected 
          ? "bg-foreground text-background" 
          : "bg-primary/10 text-primary",
        className
      )}
    >
      {dezena.toString().padStart(2, "0")}
    </div>
  );
}
