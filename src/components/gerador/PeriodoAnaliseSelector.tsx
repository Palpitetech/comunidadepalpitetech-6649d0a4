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
  { value: 1, label: "Último concurso" },
  { value: 2, label: "Últimos 2 concursos" },
  { value: 3, label: "Últimos 3 concursos" },
  { value: 4, label: "Últimos 4 concursos" },
  { value: 5, label: "Últimos 5 concursos" },
  { value: 6, label: "Últimos 6 concursos" },
  { value: 7, label: "Últimos 7 concursos" },
  { value: 8, label: "Últimos 8 concursos" },
  { value: 9, label: "Últimos 9 concursos" },
  { value: 10, label: "Últimos 10 concursos" },
  { value: 15, label: "Últimos 15 concursos" },
  { value: 20, label: "Últimos 20 concursos" },
  { value: 25, label: "Últimos 25 concursos" },
  { value: 30, label: "Últimos 30 concursos" },
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
