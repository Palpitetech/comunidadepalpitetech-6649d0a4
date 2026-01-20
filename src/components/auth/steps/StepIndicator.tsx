import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  number: number;
  label: string;
  active: boolean;
  completed?: boolean;
}

export function StepIndicator({ number, label, active, completed }: StepIndicatorProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-300",
          completed
            ? "bg-accent text-accent-foreground shadow-lg"
            : active
            ? "bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/30"
            : "bg-muted text-muted-foreground"
        )}
      >
        {completed ? <Check className="h-7 w-7" /> : number}
      </div>
      <span
        className={cn(
          "text-senior-sm font-medium transition-colors",
          active || completed ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </div>
  );
}
