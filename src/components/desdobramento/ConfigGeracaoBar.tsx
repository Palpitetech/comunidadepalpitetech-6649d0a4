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

export function ConfigGeracaoBar({
  qtdDezenas,
  onQtdDezenasChange,
  qtdPalpites,
  onQtdPalpitesChange,
  disabled = false,
}: ConfigGeracaoBarProps) {
  const [palpitesInput, setPalpitesInput] = useState(qtdPalpites.toString());

  useEffect(() => {
    setPalpitesInput(qtdPalpites.toString());
  }, [qtdPalpites]);

  const handlePalpitesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    setPalpitesInput(rawValue);
    const numValue = parseInt(rawValue, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 250) {
      onQtdPalpitesChange(numValue);
    }
  };

  const handlePalpitesBlur = () => {
    const numValue = parseInt(palpitesInput, 10);
    if (isNaN(numValue) || numValue < 1) {
      setPalpitesInput("1");
      onQtdPalpitesChange(1);
    } else if (numValue > 250) {
      setPalpitesInput("250");
      onQtdPalpitesChange(250);
    }
  };

  const decrementPalpites = () => {
    if (qtdPalpites > 1) onQtdPalpitesChange(qtdPalpites - 1);
  };

  const incrementPalpites = () => {
    if (qtdPalpites < 250) onQtdPalpitesChange(qtdPalpites + 1);
  };

  return (
    <div className="flex items-center gap-4 p-4">
      {/* Lado esquerdo - Palpites */}
      <div className="flex-1 flex flex-col gap-3">
        <span className="text-sm font-medium text-foreground">
          Quantos palpites vamos gerar?
        </span>
        
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={decrementPalpites}
            disabled={disabled || qtdPalpites <= 1}
            className={cn(
              "h-10 w-10 rounded-full shrink-0",
              qtdPalpites <= 1 && "opacity-40"
            )}
          >
            <Minus className="h-4 w-4" />
          </Button>

          <input
            type="text"
            inputMode="numeric"
            value={palpitesInput}
            onChange={handlePalpitesChange}
            onBlur={handlePalpitesBlur}
            disabled={disabled}
            className="w-20 h-12 bg-background text-center text-2xl font-bold rounded-xl border-2 border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={incrementPalpites}
            disabled={disabled || qtdPalpites >= 250}
            className={cn(
              "h-10 w-10 rounded-full shrink-0",
              qtdPalpites >= 250 && "opacity-40"
            )}
          >
            <Plus className="h-4 w-4" />
          </Button>
          
          <span className="text-xs text-muted-foreground ml-1">
            máx 250
          </span>
        </div>
      </div>

      {/* Divisor */}
      <div className="h-16 w-px bg-border/60" />

      {/* Lado direito - Dezenas */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Qtd. Dezenas
        </span>
        
        <div className="flex items-center gap-1">
          {[15, 16, 17, 18, 19, 20].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onQtdDezenasChange(num)}
              disabled={disabled}
              className={cn(
                "h-9 w-9 rounded-lg text-sm font-semibold transition-all",
                qtdDezenas === num
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              )}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
