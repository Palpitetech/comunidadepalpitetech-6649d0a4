import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export interface TipoFechamento {
  id: string;
  dezenas: number;
  garantia: number;
  label: string;
}

export const TIPOS_FECHAMENTO: TipoFechamento[] = [
  { id: "18-14", dezenas: 18, garantia: 14, label: "18 dezenas - Garante 14 pontos" },
  { id: "19-14", dezenas: 19, garantia: 14, label: "19 dezenas - Garante 14 pontos" },
  { id: "20-14", dezenas: 20, garantia: 14, label: "20 dezenas - Garante 14 pontos" },
  { id: "21-13", dezenas: 21, garantia: 13, label: "21 dezenas - Garante 13 pontos" },
  { id: "22-13", dezenas: 22, garantia: 13, label: "22 dezenas - Garante 13 pontos" },
  { id: "23-12", dezenas: 23, garantia: 12, label: "23 dezenas - Garante 12 pontos" },
  { id: "24-12", dezenas: 24, garantia: 12, label: "24 dezenas - Garante 12 pontos" },
  { id: "25-11", dezenas: 25, garantia: 11, label: "25 dezenas - Garante 11 pontos" },
];

interface TipoFechamentoSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function TipoFechamentoSelector({ value, onChange }: TipoFechamentoSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="tipo-fechamento" className="text-senior-base font-medium">
        Tipo de Fechamento
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="tipo-fechamento" className="w-full bg-background">
          <SelectValue placeholder="Selecione o tipo de fechamento" />
        </SelectTrigger>
        <SelectContent className="bg-background z-50">
          {TIPOS_FECHAMENTO.map((tipo) => (
            <SelectItem key={tipo.id} value={tipo.id}>
              {tipo.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
