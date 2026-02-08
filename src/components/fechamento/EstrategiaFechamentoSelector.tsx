import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getMatrizesAtivas } from "@/lib/fechamento";
import { 
  matrizParaUI, 
  CATEGORIA_LABELS, 
  CATEGORIA_STYLES,
  type EstrategiaFechamentoUI 
} from "@/types/fechamento";

// Re-export do tipo para compatibilidade
export type EstrategiaFechamento = EstrategiaFechamentoUI;

/**
 * Converte as matrizes ativas para o formato de exibição do seletor
 */
export const ESTRATEGIAS_FECHAMENTO: EstrategiaFechamentoUI[] = getMatrizesAtivas().map(matrizParaUI);

interface EstrategiaFechamentoSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function EstrategiaFechamentoSelector({ value, onChange }: EstrategiaFechamentoSelectorProps) {
  const estrategiaAtual = ESTRATEGIAS_FECHAMENTO.find(e => e.id === value);

  const formatarEstrategia = (e: EstrategiaFechamentoUI) => ({
    linha1: `${e.nome} — Garantia ${e.garantia} pontos`,
    linha2: `${e.dezenas} dezenas → ${e.jogos} jogos`,
  });

  // Agrupa estratégias por categoria para melhor organização
  const estrategiasPorCategoria = ESTRATEGIAS_FECHAMENTO.reduce((acc, estrategia) => {
    const categoria = estrategia.categoria;
    if (!acc[categoria]) acc[categoria] = [];
    acc[categoria].push(estrategia);
    return acc;
  }, {} as Record<string, EstrategiaFechamentoUI[]>);

  return (
    <div className="space-y-2">
      <Label htmlFor="estrategia-fechamento" className="text-base font-medium">
        Escolha sua garantia
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="estrategia-fechamento" className="w-full bg-background h-auto py-3">
          <SelectValue placeholder="Selecione a garantia">
            {estrategiaAtual && (
              <div className="flex items-center gap-2 text-left">
                <div className="flex-1">
                  <div className="font-medium">{formatarEstrategia(estrategiaAtual).linha1}</div>
                  <div className="text-xs text-muted-foreground">{formatarEstrategia(estrategiaAtual).linha2}</div>
                </div>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-card border-border shadow-lg z-50">
          {Object.entries(estrategiasPorCategoria).map(([categoria, estrategias]) => (
            <div key={categoria}>
              {/* Header da categoria */}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border/50 bg-muted/30">
                {CATEGORIA_LABELS[categoria as keyof typeof CATEGORIA_LABELS]}
              </div>
              
              {/* Itens da categoria */}
              {estrategias.map((estrategia) => {
                const fmt = formatarEstrategia(estrategia);
                return (
                  <SelectItem 
                    key={estrategia.id} 
                    value={estrategia.id} 
                    className="py-3 cursor-pointer hover:bg-muted focus:bg-muted"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{fmt.linha1}</div>
                        <div className="text-xs text-muted-foreground">{fmt.linha2}</div>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </div>
          ))}
          
          {/* Mensagem se não houver estratégias */}
          {ESTRATEGIAS_FECHAMENTO.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              Nenhuma estratégia disponível
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
