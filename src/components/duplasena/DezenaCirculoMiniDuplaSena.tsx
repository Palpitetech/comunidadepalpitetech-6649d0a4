import { cn } from "@/lib/utils";

interface DezenaCirculoMiniDuplaSenaProps {
  dezena: number;
  className?: string;
  isSelected?: boolean;
}

export function DezenaCirculoMiniDuplaSena({ dezena, className, isSelected }: DezenaCirculoMiniDuplaSenaProps) {
  return (
    <div
      className={cn(
        "w-[30px] h-[30px] rounded-full flex items-center justify-center",
        "text-sm font-semibold",
        isSelected 
          ? "bg-foreground text-background" 
          : "bg-duplasena-primary/10 text-duplasena-primary",
        className
      )}
    >
      {dezena.toString().padStart(2, "0")}
    </div>
  );
}
