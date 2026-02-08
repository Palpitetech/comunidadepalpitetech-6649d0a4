import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface FiltroLinhaColunaProps {
  linhas: number[] | null;
  colunas: number[] | null;
  onLinhasChange: (linhas: number[] | null) => void;
  onColunasChange: (colunas: number[] | null) => void;
  qtdDezenas: number;
  linhasAtivo: boolean;
  colunasAtivo: boolean;
  onLinhasAtivoChange: (ativo: boolean) => void;
  onColunasAtivoChange: (ativo: boolean) => void;
}

// Opções válidas de dezenas por linha/coluna (0 a 5)
const OPCOES = [0, 1, 2, 3, 4, 5];

// Distribuições de referência baseadas em análise estatística
const REF_DISTRIBUICAO = {
  15: [3, 3, 3, 3, 3],
  16: [3, 3, 3, 3, 4],
  17: [3, 3, 3, 4, 4],
  18: [3, 4, 4, 4, 3],
  19: [4, 4, 4, 4, 3],
  20: [4, 4, 4, 4, 4],
};

export function FiltroLinhasColunas({
  linhas,
  colunas,
  onLinhasChange,
  onColunasChange,
  qtdDezenas,
  linhasAtivo,
  colunasAtivo,
  onLinhasAtivoChange,
  onColunasAtivoChange,
}: FiltroLinhaColunaProps) {
  // Valores padrão baseados na quantidade de dezenas
  const refDistribuicao = REF_DISTRIBUICAO[qtdDezenas as keyof typeof REF_DISTRIBUICAO] || [3, 3, 3, 3, 3];
  
  const linhasEfetivas = linhas ?? refDistribuicao;
  const colunasEfetivas = colunas ?? refDistribuicao;

  const somaLinhas = linhasEfetivas.reduce((a, b) => a + b, 0);
  const somaColunas = colunasEfetivas.reduce((a, b) => a + b, 0);

  const handleLinhaChange = (index: number, value: number) => {
    const novasLinhas = [...linhasEfetivas];
    novasLinhas[index] = value;
    onLinhasChange(novasLinhas);
  };

  const handleColunaChange = (index: number, value: number) => {
    const novasColunas = [...colunasEfetivas];
    novasColunas[index] = value;
    onColunasChange(novasColunas);
  };

  const handleLinhasRef = () => {
    onLinhasChange(refDistribuicao);
  };

  const handleColunasRef = () => {
    onColunasChange(refDistribuicao);
  };

  const getDistribuicaoLabel = (valores: number[]) => {
    const isRef = valores.every((v, i) => v === refDistribuicao[i]);
    if (isRef) return "Ref.";
    return valores.join("-");
  };

  const refRange = `${Math.min(...refDistribuicao)}-${Math.max(...refDistribuicao)}`;

  return (
    <div className="divide-y">
      {/* Filtro de Linhas */}
      <div className={cn(
        "py-4 transition-opacity",
        !linhasAtivo && "opacity-50"
      )}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-base">Linhas</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs font-normal px-2 py-0.5">
                Ref: {refRange}
              </Badge>
              {linhasAtivo && somaLinhas !== qtdDezenas && (
                <Badge variant="destructive" className="text-xs font-normal px-2 py-0.5">
                  Soma: {somaLinhas}/{qtdDezenas}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={linhasAtivo}
              onCheckedChange={onLinhasAtivoChange}
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={!linhasAtivo}>
                <Button
                  variant="outline"
                  className={cn(
                    "min-w-[100px] justify-between gap-2 h-10",
                    !linhasAtivo && "pointer-events-none"
                  )}
                >
                  <span>{getDistribuicaoLabel(linhasEfetivas)}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent 
                align="end" 
                className="w-64 bg-popover border shadow-lg z-50 p-3"
              >
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs h-8 mb-3"
                  onClick={handleLinhasRef}
                >
                  Usar Referência ({refDistribuicao.join("-")})
                </Button>
                
                <DropdownMenuSeparator className="mb-3" />
                
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((linha, index) => (
                    <div key={`linha-${linha}`} className="space-y-1">
                      <label className="text-[10px] text-muted-foreground text-center block">
                        L{linha}
                      </label>
                      <div className="flex flex-col gap-0.5">
                        {OPCOES.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleLinhaChange(index, opt)}
                            className={cn(
                              "h-7 text-xs rounded transition-colors",
                              linhasEfetivas[index] === opt
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-accent"
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className={cn(
                  "mt-3 text-center text-xs font-medium",
                  somaLinhas === qtdDezenas ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                )}>
                  Total: {somaLinhas}/{qtdDezenas}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Filtro de Colunas */}
      <div className={cn(
        "py-4 transition-opacity",
        !colunasAtivo && "opacity-50"
      )}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-base">Colunas</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs font-normal px-2 py-0.5">
                Ref: {refRange}
              </Badge>
              {colunasAtivo && somaColunas !== qtdDezenas && (
                <Badge variant="destructive" className="text-xs font-normal px-2 py-0.5">
                  Soma: {somaColunas}/{qtdDezenas}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={colunasAtivo}
              onCheckedChange={onColunasAtivoChange}
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={!colunasAtivo}>
                <Button
                  variant="outline"
                  className={cn(
                    "min-w-[100px] justify-between gap-2 h-10",
                    !colunasAtivo && "pointer-events-none"
                  )}
                >
                  <span>{getDistribuicaoLabel(colunasEfetivas)}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent 
                align="end" 
                className="w-64 bg-popover border shadow-lg z-50 p-3"
              >
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs h-8 mb-3"
                  onClick={handleColunasRef}
                >
                  Usar Referência ({refDistribuicao.join("-")})
                </Button>
                
                <DropdownMenuSeparator className="mb-3" />
                
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((coluna, index) => (
                    <div key={`coluna-${coluna}`} className="space-y-1">
                      <label className="text-[10px] text-muted-foreground text-center block">
                        C{coluna}
                      </label>
                      <div className="flex flex-col gap-0.5">
                        {OPCOES.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleColunaChange(index, opt)}
                            className={cn(
                              "h-7 text-xs rounded transition-colors",
                              colunasEfetivas[index] === opt
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-accent"
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className={cn(
                  "mt-3 text-center text-xs font-medium",
                  somaColunas === qtdDezenas ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                )}>
                  Total: {somaColunas}/{qtdDezenas}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
