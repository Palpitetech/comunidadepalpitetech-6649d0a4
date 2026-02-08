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
  nome: string;
  dezenas: number;
  garantia: number;
  jogos: number;
  label: string;
  descricao: string;
  condicao: string;
}

export const ESTRATEGIAS_FECHAMENTO: EstrategiaFechamento[] = [
  { 
    id: "16-14-4", 
    nome: "FC01",
    dezenas: 16, 
    garantia: 14, 
    jogos: 4,
    label: "FC01 — 16 Dezenas → 4 Jogos",
    descricao: "Garantia 14 pontos",
    condicao: "Se acertar 15 dos 16 números"
  },
  { 
    id: "17-14-8", 
    nome: "FC02",
    dezenas: 17, 
    garantia: 14, 
    jogos: 8,
    label: "FC02 — 17 Dezenas → 8 Jogos",
    descricao: "Garantia 14 pontos",
    condicao: "Se acertar 15 dos 17 números"
  },
  { 
    id: "18-14-16", 
    nome: "FC03",
    dezenas: 18, 
    garantia: 14, 
    jogos: 16,
    label: "FC03 — 18 Dezenas → 16 Jogos",
    descricao: "Garantia 14 pontos",
    condicao: "Se acertar 15 dos 18 números"
  },
  { 
    id: "19-14-24", 
    nome: "FC04",
    dezenas: 19, 
    garantia: 14, 
    jogos: 24,
    label: "FC04 — 19 Dezenas → 24 Jogos",
    descricao: "Garantia 14 pontos",
    condicao: "Se acertar 15 dos 19 números"
  },
  { 
    id: "20-14-32", 
    nome: "FC05",
    dezenas: 20, 
    garantia: 14, 
    jogos: 32,
    label: "FC05 — 20 Dezenas → 32 Jogos",
    descricao: "Garantia 14 pontos",
    condicao: "Se acertar 15 dos 20 números"
  },
];

interface EstrategiaFechamentoSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function EstrategiaFechamentoSelector({ value, onChange }: EstrategiaFechamentoSelectorProps) {
  const estrategiaAtual = ESTRATEGIAS_FECHAMENTO.find(e => e.id === value);

  const formatarEstrategia = (e: EstrategiaFechamento) => ({
    linha1: `${e.nome} — Garantia ${e.garantia} pontos`,
    linha2: `${e.jogos} jogos, 15 dezenas por jogo`,
  });

  return (
    <div className="space-y-2">
      <Label htmlFor="estrategia-fechamento" className="text-base font-medium">
        Escolha sua garantia
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="estrategia-fechamento" className="w-full bg-background h-auto py-3">
          <SelectValue placeholder="Selecione a garantia">
            {estrategiaAtual && (
              <div className="text-left">
                <div className="font-medium">{formatarEstrategia(estrategiaAtual).linha1}</div>
                <div className="text-xs text-muted-foreground">{formatarEstrategia(estrategiaAtual).linha2}</div>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-background z-50">
          {ESTRATEGIAS_FECHAMENTO.map((estrategia) => {
            const fmt = formatarEstrategia(estrategia);
            return (
              <SelectItem key={estrategia.id} value={estrategia.id} className="py-3">
                <div>
                  <div className="font-medium">{fmt.linha1}</div>
                  <div className="text-xs text-muted-foreground">{fmt.linha2}</div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
