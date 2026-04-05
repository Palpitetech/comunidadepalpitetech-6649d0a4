import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PeriodoAnaliseSelectorProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const opcoes = [
  { value: 50, label: "Últimos 50 concursos" },
  { value: 100, label: "Últimos 100 concursos" },
  { value: 200, label: "Últimos 200 concursos" },
  { value: 500, label: "Últimos 500 concursos" },
];

export function PeriodoAnaliseSelector({
  value,
  onChange,
  disabled,
}: PeriodoAnaliseSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Período de Análise</Label>
      <Select
        value={String(value)}
        onValueChange={(v) => onChange(Number(v))}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {opcoes.map((op) => (
            <SelectItem key={op.value} value={String(op.value)}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
