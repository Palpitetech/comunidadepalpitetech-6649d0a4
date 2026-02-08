import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface FiltroLinhasColumasMegaSenaProps {
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

export function FiltroLinhasColunasMegaSena({
  linhas,
  colunas,
  onLinhasChange,
  onColunasChange,
  qtdDezenas,
  linhasAtivo,
  colunasAtivo,
  onLinhasAtivoChange,
  onColunasAtivoChange,
}: FiltroLinhasColumasMegaSenaProps) {
  const handleLinhaChange = (index: number, value: string) => {
    const newLinhas = [...(linhas || [0, 0, 0, 0, 0, 0])];
    newLinhas[index] = parseInt(value) || 0;
    onLinhasChange(newLinhas);
  };

  const handleColunaChange = (index: number, value: string) => {
    const newColunas = [...(colunas || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0])];
    newColunas[index] = parseInt(value) || 0;
    onColunasChange(newColunas);
  };

  const somaLinhas = linhas ? linhas.reduce((a, b) => a + b, 0) : 0;
  const somaColunas = colunas ? colunas.reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="space-y-4">
      {/* Linhas */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Linhas (6)</Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Soma: {linhasAtivo ? somaLinhas : "-"}
            </span>
            <Switch
              checked={linhasAtivo}
              onCheckedChange={(checked) => {
                onLinhasAtivoChange(checked);
                if (checked && !linhas) {
                  onLinhasChange([1, 1, 1, 1, 1, 1]);
                }
              }}
            />
          </div>
        </div>
        {linhasAtivo && (
          <div className="grid grid-cols-6 gap-1">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="text-center">
                <span className="text-[10px] text-muted-foreground block mb-1">
                  L{i + 1}
                </span>
                <Input
                  type="number"
                  min={0}
                  max={qtdDezenas}
                  value={linhas?.[i] ?? 1}
                  onChange={(e) => handleLinhaChange(i, e.target.value)}
                  className="h-8 text-center text-sm px-1"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Colunas */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Colunas (10)</Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Soma: {colunasAtivo ? somaColunas : "-"}
            </span>
            <Switch
              checked={colunasAtivo}
              onCheckedChange={(checked) => {
                onColunasAtivoChange(checked);
                if (checked && !colunas) {
                  onColunasChange([1, 1, 0, 1, 0, 1, 0, 1, 0, 1]);
                }
              }}
            />
          </div>
        </div>
        {colunasAtivo && (
          <div className="grid grid-cols-10 gap-1">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <div key={i} className="text-center">
                <span className="text-[10px] text-muted-foreground block mb-1">
                  C{i + 1}
                </span>
                <Input
                  type="number"
                  min={0}
                  max={qtdDezenas}
                  value={colunas?.[i] ?? 0}
                  onChange={(e) => handleColunaChange(i, e.target.value)}
                  className="h-8 text-center text-sm px-0.5"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Validação */}
      {linhasAtivo && somaLinhas !== qtdDezenas && (
        <p className="text-xs text-destructive">
          Soma das linhas ({somaLinhas}) deve ser igual a {qtdDezenas}
        </p>
      )}
      {colunasAtivo && somaColunas !== qtdDezenas && (
        <p className="text-xs text-destructive">
          Soma das colunas ({somaColunas}) deve ser igual a {qtdDezenas}
        </p>
      )}
    </div>
  );
}
