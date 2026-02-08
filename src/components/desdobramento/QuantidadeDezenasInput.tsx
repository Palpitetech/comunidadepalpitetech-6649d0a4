import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

interface QuantidadeDezenasInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
}

export function QuantidadeDezenasInput({
  value,
  onChange,
  disabled = false,
  min = 15,
  max = 20,
}: QuantidadeDezenasInputProps) {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    } else {
      setInputValue(numValue.toString());
      onChange(numValue);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="qtdDezenas" className="text-sm font-medium">
        Dezenas por palpite
      </Label>
      <div className="flex items-center gap-3">
        <Input
          id="qtdDezenas"
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          className="w-20 text-center text-lg font-semibold h-12"
          placeholder={`${min}-${max}`}
        />
        <span className="text-sm text-muted-foreground">
          dezenas (mín: {min}, máx: {max})
        </span>
      </div>
    </div>
  );
}
