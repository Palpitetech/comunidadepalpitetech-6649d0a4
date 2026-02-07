import { cn } from "@/lib/utils";

interface DezenasSelectorProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const DEZENAS_OPTIONS = [15, 16, 17, 18, 19, 20];

export function DezenasSelector({
  value,
  onChange,
  disabled = false,
}: DezenasSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="text-center">
        <p className="text-sm font-medium text-foreground mb-1">Dezenas por palpite</p>
        <p className="text-xs text-muted-foreground">Quantas dezenas em cada jogo?</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {DEZENAS_OPTIONS.map((num) => (
          <button
            key={num}
            onClick={() => onChange(num)}
            disabled={disabled}
            className={cn(
              "w-12 h-11 rounded-lg font-semibold text-lg transition-all",
              "border-2 focus:outline-none focus:ring-2 focus:ring-primary/50",
              value === num
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border hover:border-primary/50 hover:bg-accent",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
}
