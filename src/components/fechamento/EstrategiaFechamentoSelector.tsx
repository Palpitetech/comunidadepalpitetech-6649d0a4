import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MATRIZES_FECHAMENTO, MatrizFechamento } from "@/lib/fechamento";

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

/**
 * Converte as matrizes universais para o formato de exibição do seletor
 */
export const ESTRATEGIAS_FECHAMENTO: EstrategiaFechamento[] = MATRIZES_FECHAMENTO.map(
  (matriz) => ({
    id: matriz.id,
    nome: matriz.nome,
    dezenas: matriz.dezenas,
    garantia: matriz.garantia,
    jogos: matriz.matrizRemocoes.length,
    label: `${matriz.nome} — ${matriz.dezenas} Dezenas → ${matriz.matrizRemocoes.length} Jogos`,
    descricao: `Garantia ${matriz.garantia} pontos`,
    condicao: matriz.condicao,
  })
);

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
        <SelectContent className="bg-card border-border shadow-lg z-50">
          {ESTRATEGIAS_FECHAMENTO.map((estrategia) => {
            const fmt = formatarEstrategia(estrategia);
            return (
              <SelectItem 
                key={estrategia.id} 
                value={estrategia.id} 
                className="py-3 cursor-pointer hover:bg-muted focus:bg-muted"
              >
                <div>
                  <div className="font-medium text-foreground">{fmt.linha1}</div>
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
