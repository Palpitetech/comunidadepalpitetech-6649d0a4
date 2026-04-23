import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DezenasSelectorProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  options?: number[];
}

const DEFAULT_OPTIONS = [15, 16, 17, 18, 19, 20];

export function DezenasSelector({
  value,
  onChange,
  disabled = false,
  options,
}: DezenasSelectorProps) {
  const DEZENAS_OPTIONS = options ?? DEFAULT_OPTIONS;
  const minDez = Math.min(...DEZENAS_OPTIONS);
  const maxDez = Math.max(...DEZENAS_OPTIONS);
  const handleSelectChange = (val: string) => {
    onChange(parseInt(val, 10));
  };

  return (
    <div className="space-y-3">
      <div className="text-center">
        <p className="text-sm font-medium text-foreground mb-1">Dezenas por palpite</p>
        <p className="text-xs text-muted-foreground">Quantas dezenas em cada jogo? ({minDez} a {maxDez})</p>
      </div>

      <div className="flex justify-center">
        <Select
          value={value.toString()}
          onValueChange={handleSelectChange}
          disabled={disabled}
        >
          <SelectTrigger className={cn(
            "w-48 h-12 text-lg font-semibold justify-center",
            disabled && "opacity-50 cursor-not-allowed"
          )}>
            <SelectValue placeholder="Selecione">
              {value} dezena{value > 1 ? "s" : ""}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            {DEZENAS_OPTIONS.map((num) => (
              <SelectItem key={num} value={num.toString()} className="text-base">
                {num} dezena{num > 1 ? "s" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
