import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Minus, Plus, Dices, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfigGeracaoBarProps {
  qtdDezenas: number;
  onQtdDezenasChange: (value: number) => void;
  qtdPalpites: number;
  onQtdPalpitesChange: (value: number) => void;
  disabled?: boolean;
}

interface StepperInputProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  highlight?: boolean;
}

function StepperInput({
  value,
  onChange,
  min,
  max,
  label,
  icon,
  disabled = false,
  highlight = false,
}: StepperInputProps) {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    setInputValue(rawValue);
    const numValue = parseInt(rawValue, 10);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue);
    }
  };

  const handleBlur = () => {
    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue) || numValue < min) {
      setInputValue(min.toString());
      onChange(min);
    } else if (numValue > max) {
      setInputValue(max.toString());
      onChange(max);
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const isAtMin = value <= min;
  const isAtMax = value >= max;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-xl transition-all",
        highlight
          ? "bg-primary/10 border-2 border-primary/30"
          : "bg-muted/50 border border-border/50"
      )}
    >
      {/* Header com ícone e label */}
      <div className="flex items-center gap-1.5">
        <span className={cn(
          "p-1 rounded-md",
          highlight ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
        )}>
          {icon}
        </span>
        <span className={cn(
          "text-xs font-semibold uppercase tracking-wider",
          highlight ? "text-primary" : "text-muted-foreground"
        )}>
          {label}
        </span>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleDecrement}
          disabled={disabled || isAtMin}
          className={cn(
            "h-10 w-10 rounded-full shrink-0 transition-all border",
            isAtMin 
              ? "opacity-30 border-transparent" 
              : "border-border hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive"
          )}
        >
          <Minus className="h-4 w-4" />
        </Button>

        <input
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={cn(
            "bg-background text-center font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-xl transition-all border-2",
            highlight
              ? "w-20 text-3xl h-14 border-primary/20 text-primary"
              : "w-16 text-2xl h-12 border-border/50"
          )}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleIncrement}
          disabled={disabled || isAtMax}
          className={cn(
            "h-10 w-10 rounded-full shrink-0 transition-all border",
            isAtMax 
              ? "opacity-30 border-transparent" 
              : "border-border hover:bg-primary/10 hover:border-primary/50 hover:text-primary"
          )}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Range hint */}
      <span className="text-[10px] text-muted-foreground/60 font-medium">
        {min} – {max}
      </span>
    </div>
  );
}

export function ConfigGeracaoBar({
  qtdDezenas,
  onQtdDezenasChange,
  qtdPalpites,
  onQtdPalpitesChange,
  disabled = false,
}: ConfigGeracaoBarProps) {
  return (
    <div className="flex items-stretch justify-center gap-3 py-4 px-3">
      {/* Dezenas por palpite */}
      <StepperInput
        value={qtdDezenas}
        onChange={onQtdDezenasChange}
        min={15}
        max={20}
        label="Dezenas"
        icon={<Hash className="h-3.5 w-3.5" />}
        disabled={disabled}
      />

      {/* Quantidade de palpites - destacado */}
      <StepperInput
        value={qtdPalpites}
        onChange={onQtdPalpitesChange}
        min={1}
        max={250}
        label="Palpites"
        icon={<Dices className="h-3.5 w-3.5" />}
        disabled={disabled}
        highlight
      />
    </div>
  );
}
