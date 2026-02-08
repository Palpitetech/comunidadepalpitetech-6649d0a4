import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface EstatisticaItem {
  valor: number;
  ocorrencias: number;
  ranking: number;
}

interface FiltroPatternSelectorProps {
  label: string;
  emoji: string;
  value: number;
  onChange: (value: number) => void;
  options: EstatisticaItem[];
  disabled?: boolean;
  complementLabel?: string;
}

export function FiltroPatternSelector({
  label,
  emoji,
  value,
  onChange,
  options,
  disabled = false,
  complementLabel,
}: FiltroPatternSelectorProps) {
  // Ordena as opções: top 3 por ocorrência primeiro, depois as demais por valor
  const sortedOptions = [...options].sort((a, b) => {
    // Top 3 vem primeiro
    if (a.ranking <= 3 && b.ranking > 3) return -1;
    if (a.ranking > 3 && b.ranking <= 3) return 1;
    // Dentro do mesmo grupo, ordena por valor
    return a.valor - b.valor;
  });

  const selectedOption = options.find((o) => o.valor === value);
  const complement = 15 - value;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-lg">{emoji}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>

      <Select
        value={value.toString()}
        onValueChange={(v) => onChange(parseInt(v, 10))}
        disabled={disabled}
      >
        <SelectTrigger className="w-full h-11 bg-card">
          <SelectValue>
            <span className="flex items-center gap-2">
              <span className="font-semibold">{value}</span>
              {complementLabel && (
                <span className="text-muted-foreground text-xs">
                  ({complement} {complementLabel})
                </span>
              )}
              {selectedOption && selectedOption.ranking <= 3 && (
                <span className="text-xs text-primary font-medium">★ Top {selectedOption.ranking}</span>
              )}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          {sortedOptions.map((option) => (
            <SelectItem
              key={option.valor}
              value={option.valor.toString()}
              className={cn(
                "text-base",
                option.ranking <= 3 && "bg-primary/5"
              )}
            >
              <div className="flex items-center justify-between w-full gap-4">
                <span className="font-medium">
                  {option.valor} {label.toLowerCase()}
                  {complementLabel && (
                    <span className="text-muted-foreground text-xs ml-1">
                      ({15 - option.valor} {complementLabel})
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    option.ranking <= 3
                      ? "bg-primary text-primary-foreground"
                      : option.ranking <= 5
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {option.ocorrencias}x
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
