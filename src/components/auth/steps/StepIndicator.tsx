import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  number: number;
  label: string;
}

interface StepIndicatorProps {
  currentStep: number;
  steps: Step[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-3 md:gap-4">
      {steps.map((step, index) => {
        const isActive = step.number === currentStep;
        const isCompleted = step.number < currentStep;

        return (
          <div key={step.number} className="flex items-center gap-3 md:gap-4">
            <div className="flex flex-col items-center gap-1.5 md:gap-2">
              <div
                className={cn(
                  "w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center text-base md:text-xl font-bold transition-all duration-300",
                  isCompleted
                    ? "bg-accent text-accent-foreground shadow-lg"
                    : isActive
                    ? "bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/30"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-5 w-5 md:h-7 md:w-7" /> : step.number}
              </div>
              <span
                className={cn(
                  "text-xs md:text-senior-sm font-medium transition-colors",
                  isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-6 md:w-8 h-1 rounded-full transition-colors mb-5 md:mb-6",
                  step.number < currentStep ? "bg-accent" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
