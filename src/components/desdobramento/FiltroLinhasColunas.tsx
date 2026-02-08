import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Rows3, Columns3 } from "lucide-react";

interface FiltroLinhaColunaProps {
  linhas: number[];
  colunas: number[];
  onLinhasChange: (linhas: number[]) => void;
  onColunasChange: (colunas: number[]) => void;
  qtdDezenas: number;
  disabled?: boolean;
}

// Opções válidas de dezenas por linha/coluna (0 a 5, considerando jogo de 15-20 dezenas)
const OPCOES = [0, 1, 2, 3, 4, 5];

export function FiltroLinhasColunas({
  linhas,
  colunas,
  onLinhasChange,
  onColunasChange,
  qtdDezenas,
  disabled = false,
}: FiltroLinhaColunaProps) {
  const handleLinhaChange = (index: number, value: number) => {
    const novasLinhas = [...linhas];
    novasLinhas[index] = value;
    onLinhasChange(novasLinhas);
  };

  const handleColunaChange = (index: number, value: number) => {
    const novasColunas = [...colunas];
    novasColunas[index] = value;
    onColunasChange(novasColunas);
  };

  const somaLinhas = linhas.reduce((a, b) => a + b, 0);
  const somaColunas = colunas.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* Filtro de Linhas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Rows3 className="h-4 w-4 text-primary" />
            Dezenas por Linha
            <span className={`text-xs ml-auto ${somaLinhas === qtdDezenas ? 'text-green-600' : 'text-muted-foreground'}`}>
              Total: {somaLinhas}/{qtdDezenas}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((linha, index) => (
              <div key={`linha-${linha}`} className="space-y-1">
                <label className="text-xs text-muted-foreground text-center block">
                  L{linha}
                </label>
                <Select
                  value={linhas[index].toString()}
                  onValueChange={(v) => handleLinhaChange(index, parseInt(v, 10))}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-10 text-center bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {OPCOES.map((opt) => (
                      <SelectItem key={opt} value={opt.toString()}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filtro de Colunas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Columns3 className="h-4 w-4 text-primary" />
            Dezenas por Coluna
            <span className={`text-xs ml-auto ${somaColunas === qtdDezenas ? 'text-green-600' : 'text-muted-foreground'}`}>
              Total: {somaColunas}/{qtdDezenas}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((coluna, index) => (
              <div key={`coluna-${coluna}`} className="space-y-1">
                <label className="text-xs text-muted-foreground text-center block">
                  C{coluna}
                </label>
                <Select
                  value={colunas[index].toString()}
                  onValueChange={(v) => handleColunaChange(index, parseInt(v, 10))}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-10 text-center bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {OPCOES.map((opt) => (
                      <SelectItem key={opt} value={opt.toString()}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
