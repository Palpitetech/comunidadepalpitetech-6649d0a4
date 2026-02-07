import { cn } from "@/lib/utils";

interface QuantidadeSelectorProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  disabled?: boolean;
}

export function QuantidadeSelector({
  value,
  onChange,
  max = 10,
  disabled = false,
}: QuantidadeSelectorProps) {
  const options = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <div className="space-y-3">
      <div className="text-center">
        <p className="text-sm font-medium text-foreground mb-1">Quantidade de palpites</p>
        <p className="text-xs text-muted-foreground">Quantos jogos você quer gerar?</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {options.map((num) => (
          <button
            key={num}
            onClick={() => onChange(num)}
            disabled={disabled}
            className={cn(
              "w-11 h-11 rounded-lg font-semibold text-lg transition-all",
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
