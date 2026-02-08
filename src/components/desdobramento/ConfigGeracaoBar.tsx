import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Minus, Plus } from "lucide-react";
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
  sublabel?: string;
  disabled?: boolean;
  size?: "sm" | "lg";
}

function StepperInput({
  value,
  onChange,
  min,
  max,
  label,
  sublabel,
  disabled = false,
  size = "sm",
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
    <div className="flex flex-col items-center gap-1.5">
      {/* Label */}
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>

      {/* Stepper */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleDecrement}
          disabled={disabled || isAtMin}
          className={cn(
            "h-9 w-9 rounded-full shrink-0 transition-all",
            isAtMin && "opacity-30"
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
            "bg-transparent text-center font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg transition-all",
            size === "lg" ? "w-16 text-2xl h-12" : "w-12 text-xl h-10"
          )}
        />

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleIncrement}
          disabled={disabled || isAtMax}
          className={cn(
            "h-9 w-9 rounded-full shrink-0 transition-all",
            isAtMax && "opacity-30"
          )}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Sublabel com range */}
      {sublabel && (
        <span className="text-[10px] text-muted-foreground/70">
          {sublabel}
        </span>
      )}
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
    <div className="flex items-center justify-center gap-8 py-4 px-2">
      {/* Dezenas por palpite */}
      <StepperInput
        value={qtdDezenas}
        onChange={onQtdDezenasChange}
        min={15}
        max={20}
        label="Dezenas"
        sublabel="15 a 20"
        disabled={disabled}
      />

      {/* Divisor visual */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-2xl font-light text-muted-foreground/50">×</span>
      </div>

      {/* Quantidade de palpites */}
      <StepperInput
        value={qtdPalpites}
        onChange={onQtdPalpitesChange}
        min={1}
        max={250}
        label="Palpites"
        sublabel="máx 250"
        disabled={disabled}
        size="lg"
      />
    </div>
  );
}
