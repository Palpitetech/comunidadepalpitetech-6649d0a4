import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  getMatrizesAtivasMegaSena, 
  matrizParaUIMegaSena,
  type EstrategiaFechamentoMegaSenaUI,
} from "@/lib/fechamentoMegaSena";

export const ESTRATEGIAS_FECHAMENTO_MEGASENA: EstrategiaFechamentoMegaSenaUI[] = 
  getMatrizesAtivasMegaSena().map(matrizParaUIMegaSena);

interface EstrategiaFechamentoSelectorMegaSenaProps {
  value: string;
  onChange: (value: string) => void;
}

export function EstrategiaFechamentoSelectorMegaSena({ 
  value, 
  onChange 
}: EstrategiaFechamentoSelectorMegaSenaProps) {
  const estrategiaAtual = ESTRATEGIAS_FECHAMENTO_MEGASENA.find(e => e.id === value);

  const formatarEstrategia = (e: EstrategiaFechamentoMegaSenaUI) => ({
    linha1: `${e.nome} - Garantia ${e.garantia}pts`,
    linha2: `${e.dezenas} dezenas - ${e.jogos} jogos de 6 dezenas`,
  });

  return (
    <div className="space-y-2">
      <Label htmlFor="estrategia-fechamento-ms" className="text-base font-medium">
        Escolha sua garantia
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="estrategia-fechamento-ms" className="w-full bg-background h-auto py-3">
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
          {ESTRATEGIAS_FECHAMENTO_MEGASENA.map((estrategia) => {
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
