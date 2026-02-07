import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface QuantidadeSelectorProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  disabled?: boolean;
}

// Opções rápidas para o dropdown
const QUICK_OPTIONS = [1, 3, 5, 10, 15, 20, 25, 50, 100, 150, 200, 250];

export function QuantidadeSelector({
  value,
  onChange,
  max = 250,
  disabled = false,
}: QuantidadeSelectorProps) {
  const [customMode, setCustomMode] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());

  const handleSelectChange = (val: string) => {
    if (val === "custom") {
      setCustomMode(true);
      setInputValue(value.toString());
    } else {
      setCustomMode(false);
      onChange(parseInt(val, 10));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    setInputValue(rawValue);
    
    const numValue = parseInt(rawValue, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= max) {
      onChange(numValue);
    }
  };

  const handleInputBlur = () => {
    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue) || numValue < 1) {
      setInputValue("1");
      onChange(1);
    } else if (numValue > max) {
      setInputValue(max.toString());
      onChange(max);
    } else {
      setInputValue(numValue.toString());
      onChange(numValue);
    }
  };

  // Verificar se o valor atual está nas opções rápidas
  const isQuickOption = QUICK_OPTIONS.includes(value);

  return (
    <div className="space-y-3">
      <div className="text-center">
        <p className="text-sm font-medium text-foreground mb-1">Quantidade de palpites</p>
        <p className="text-xs text-muted-foreground">Escolha ou digite até {max} jogos</p>
      </div>
      
      <div className="flex justify-center">
        {customMode ? (
          <div className="flex items-center gap-2">
            <Input
              type="text"
              inputMode="numeric"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              disabled={disabled}
              className="w-24 text-center text-lg font-semibold"
              placeholder="1-250"
              autoFocus
            />
            <button
              onClick={() => {
                setCustomMode(false);
                if (!isQuickOption) {
                  // Se não é opção rápida, volta para o valor mais próximo
                  const closest = QUICK_OPTIONS.reduce((prev, curr) =>
                    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
                  );
                  onChange(closest);
                }
              }}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <Select
            value={isQuickOption ? value.toString() : "custom"}
            onValueChange={handleSelectChange}
            disabled={disabled}
          >
            <SelectTrigger className={cn(
              "w-48 h-12 text-lg font-semibold justify-center",
              disabled && "opacity-50 cursor-not-allowed"
            )}>
              <SelectValue placeholder="Selecione">
                {isQuickOption ? `${value} jogo${value > 1 ? "s" : ""}` : `${value} jogos`}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {QUICK_OPTIONS.map((num) => (
                <SelectItem key={num} value={num.toString()} className="text-base">
                  {num} jogo{num > 1 ? "s" : ""}
                </SelectItem>
              ))}
              <SelectItem value="custom" className="text-base text-primary">
                ✏️ Digitar valor...
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
