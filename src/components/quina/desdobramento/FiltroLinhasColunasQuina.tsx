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

interface FiltroLinhasColunasQuinaProps {
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

// Quina grid: 8 linhas × 10 colunas (80 dezenas)
const NUM_LINHAS = 8;
const NUM_COLUNAS = 10;

// Opções válidas por célula
const OPCOES_LINHA = [0, 1, 2, 3, 4, 5]; // max 10 por linha but 5 dezenas max selection
const OPCOES_COLUNA = [0, 1, 2, 3, 4, 5]; // max 8 por coluna

// Referências para distribuições comuns
function getRefLinhas(qtd: number): number[] {
  // Distribuir qtd dezenas uniformemente entre 8 linhas
  const base = Math.floor(qtd / NUM_LINHAS);
  const resto = qtd % NUM_LINHAS;
  return Array.from({ length: NUM_LINHAS }, (_, i) => base + (i < resto ? 1 : 0));
}

function getRefColunas(qtd: number): number[] {
  const base = Math.floor(qtd / NUM_COLUNAS);
  const resto = qtd % NUM_COLUNAS;
  return Array.from({ length: NUM_COLUNAS }, (_, i) => base + (i < resto ? 1 : 0));
}

export function FiltroLinhasColunasQuina({
  linhas,
  colunas,
  onLinhasChange,
  onColunasChange,
  qtdDezenas,
  linhasAtivo,
  colunasAtivo,
  onLinhasAtivoChange,
  onColunasAtivoChange,
}: FiltroLinhasColunasQuinaProps) {
  const refLinhas = getRefLinhas(qtdDezenas);
  const refColunas = getRefColunas(qtdDezenas);

  const linhasEfetivas = linhas ?? refLinhas;
  const colunasEfetivas = colunas ?? refColunas;

  const somaLinhas = linhasEfetivas.reduce((a, b) => a + b, 0);
  const somaColunas = colunasEfetivas.reduce((a, b) => a + b, 0);

  const handleLinhaChange = (index: number, value: number) => {
    const novas = [...linhasEfetivas];
    novas[index] = value;
    onLinhasChange(novas);
  };

  const handleColunaChange = (index: number, value: number) => {
    const novas = [...colunasEfetivas];
    novas[index] = value;
    onColunasChange(novas);
  };

  const getLabel = (valores: number[], ref: number[]) => {
    const isRef = valores.every((v, i) => v === ref[i]);
    if (isRef) return "Ref.";
    return valores.join("-");
  };

  return (
    <div className="divide-y">
      {/* Linhas (8) */}
      <div className={cn("py-4 transition-opacity", !linhasAtivo && "opacity-50")}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-base">Linhas (8)</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs font-normal px-2 py-0.5">
                Ref: {refLinhas.join("-")}
              </Badge>
              {linhasAtivo && somaLinhas !== qtdDezenas && (
                <Badge variant="destructive" className="text-xs font-normal px-2 py-0.5">
                  Soma: {somaLinhas}/{qtdDezenas}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={linhasAtivo} onCheckedChange={onLinhasAtivoChange} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={!linhasAtivo}>
                <Button
                  variant="outline"
                  className={cn(
                    "min-w-[100px] justify-between gap-2 h-10",
                    !linhasAtivo && "pointer-events-none"
                  )}
                >
                  <span className="text-xs truncate">{getLabel(linhasEfetivas, refLinhas)}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-popover border shadow-lg z-50 p-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-8 mb-3"
                  onClick={() => onLinhasChange(refLinhas)}
                >
                  Usar Referência ({refLinhas.join("-")})
                </Button>
                <DropdownMenuSeparator className="mb-3" />
                <div className="grid grid-cols-8 gap-1.5">
                  {Array.from({ length: NUM_LINHAS }, (_, i) => (
                    <div key={`l-${i}`} className="space-y-1">
                      <label className="text-[10px] text-muted-foreground text-center block">
                        L{i + 1}
                      </label>
                      <div className="flex flex-col gap-0.5">
                        {OPCOES_LINHA.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleLinhaChange(i, opt)}
                            className={cn(
                              "h-7 text-xs rounded transition-colors",
                              linhasEfetivas[i] === opt
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

      {/* Colunas (10) */}
      <div className={cn("py-4 transition-opacity", !colunasAtivo && "opacity-50")}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-base">Colunas (10)</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs font-normal px-2 py-0.5">
                Ref: {refColunas.join("-")}
              </Badge>
              {colunasAtivo && somaColunas !== qtdDezenas && (
                <Badge variant="destructive" className="text-xs font-normal px-2 py-0.5">
                  Soma: {somaColunas}/{qtdDezenas}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={colunasAtivo} onCheckedChange={onColunasAtivoChange} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={!colunasAtivo}>
                <Button
                  variant="outline"
                  className={cn(
                    "min-w-[100px] justify-between gap-2 h-10",
                    !colunasAtivo && "pointer-events-none"
                  )}
                >
                  <span className="text-xs truncate">{getLabel(colunasEfetivas, refColunas)}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[340px] bg-popover border shadow-lg z-50 p-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-8 mb-3"
                  onClick={() => onColunasChange(refColunas)}
                >
                  Usar Referência ({refColunas.join("-")})
                </Button>
                <DropdownMenuSeparator className="mb-3" />
                <div className="grid grid-cols-10 gap-1">
                  {Array.from({ length: NUM_COLUNAS }, (_, i) => (
                    <div key={`c-${i}`} className="space-y-1">
                      <label className="text-[9px] text-muted-foreground text-center block">
                        C{i + 1}
                      </label>
                      <div className="flex flex-col gap-0.5">
                        {OPCOES_COLUNA.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleColunaChange(i, opt)}
                            className={cn(
                              "h-6 text-[10px] rounded transition-colors",
                              colunasEfetivas[i] === opt
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
