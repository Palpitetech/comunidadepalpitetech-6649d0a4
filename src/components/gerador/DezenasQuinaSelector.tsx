import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DezenasQuinaSelectorProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const DEZENAS_OPTIONS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

export function DezenasQuinaSelector({
  value,
  onChange,
  disabled = false,
}: DezenasQuinaSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="text-center">
        <p className="text-sm font-medium text-foreground mb-1">Dezenas por palpite</p>
        <p className="text-xs text-muted-foreground">Quantas dezenas em cada jogo?</p>
      </div>

      <div className="flex justify-center">
        <Select
          value={value.toString()}
          onValueChange={(v) => onChange(parseInt(v, 10))}
          disabled={disabled}
        >
          <SelectTrigger className={cn(
            "w-48 h-12 text-lg font-semibold justify-center",
            disabled && "opacity-50 cursor-not-allowed"
          )}>
            <SelectValue>
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
