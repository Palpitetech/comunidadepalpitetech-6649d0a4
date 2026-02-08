import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export interface EstrategiaFechamento {
  id: string;
  dezenas: number;
  garantia: number;
  jogos: number;
  label: string;
  descricao: string;
}

export const ESTRATEGIAS_FECHAMENTO: EstrategiaFechamento[] = [
  { 
    id: "16-14-4", 
    dezenas: 16, 
    garantia: 14, 
    jogos: 4,
    label: "Estratégia Econômica: 16 Dezenas",
    descricao: "Garantia 14 pontos - 4 Jogos"
  },
  { 
    id: "17-14-8", 
    dezenas: 17, 
    garantia: 14, 
    jogos: 8,
    label: "17 Dezenas",
    descricao: "Garantia 14 pontos - 8 Jogos"
  },
  { 
    id: "18-14-16", 
    dezenas: 18, 
    garantia: 14, 
    jogos: 16,
    label: "18 Dezenas",
    descricao: "Garantia 14 pontos - 16 Jogos"
  },
  { 
    id: "19-14-24", 
    dezenas: 19, 
    garantia: 14, 
    jogos: 24,
    label: "19 Dezenas",
    descricao: "Garantia 14 pontos - 24 Jogos"
  },
  { 
    id: "20-14-32", 
    dezenas: 20, 
    garantia: 14, 
    jogos: 32,
    label: "20 Dezenas",
    descricao: "Garantia 14 pontos - 32 Jogos"
  },
];

interface EstrategiaFechamentoSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function EstrategiaFechamentoSelector({ value, onChange }: EstrategiaFechamentoSelectorProps) {
  const estrategiaAtual = ESTRATEGIAS_FECHAMENTO.find(e => e.id === value);

  return (
    <div className="space-y-2">
      <Label htmlFor="estrategia-fechamento" className="text-base font-medium">
        Estratégia de Fechamento
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="estrategia-fechamento" className="w-full bg-background h-auto py-3">
          <SelectValue placeholder="Selecione a estratégia">
            {estrategiaAtual && (
              <div className="text-left">
                <div className="font-medium">{estrategiaAtual.label}</div>
                <div className="text-xs text-muted-foreground">{estrategiaAtual.descricao}</div>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-background z-50">
          {ESTRATEGIAS_FECHAMENTO.map((estrategia) => (
            <SelectItem key={estrategia.id} value={estrategia.id} className="py-3">
              <div>
                <div className="font-medium">{estrategia.label}</div>
                <div className="text-xs text-muted-foreground">{estrategia.descricao}</div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
