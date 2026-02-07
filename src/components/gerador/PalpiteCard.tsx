import { Checkbox } from "@/components/ui/checkbox";
import { formatarDezena, contarImpares, contarMoldura, contarMultiplosDe3, contarRepetidas } from "@/lib/lotofacil";
import { cn } from "@/lib/utils";

interface PalpiteCardProps {
  index: number;
  dezenas: number[];
  ultimoConcursoDezenas?: number[];
  isSelected: boolean;
  onSelectChange: (checked: boolean) => void;
}

export function PalpiteCard({
  index,
  dezenas,
  ultimoConcursoDezenas = [],
  isSelected,
  onSelectChange,
}: PalpiteCardProps) {
  const impares = contarImpares(dezenas);
  const moldura = contarMoldura(dezenas);
  const multiplosDe3 = contarMultiplosDe3(dezenas);
  const repetidas = ultimoConcursoDezenas.length > 0 
    ? contarRepetidas(dezenas, ultimoConcursoDezenas) 
    : 0;

  // Dividir dezenas em 2 linhas equilibradas
  const metade = Math.ceil(dezenas.length / 2);
  const primeiraLinha = dezenas.slice(0, metade);
  const segundaLinha = dezenas.slice(metade);

  return (
    <div
      onClick={() => onSelectChange(!isSelected)}
      className={cn(
        "rounded-xl border p-3 transition-all cursor-pointer active:scale-[0.98]",
        isSelected
          ? "border-primary bg-primary/10 shadow-sm"
          : "border-border bg-card"
      )}
    >
      {/* Header com checkbox e título */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelectChange}
            className="h-5 w-5 shrink-0"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="font-semibold text-foreground text-sm">
            Jogo {String(index + 1).padStart(2, '0')}
          </span>
        </div>
        {isSelected && (
          <span className="text-[10px] font-medium text-primary bg-primary/20 px-2 py-0.5 rounded-full">
            Selecionado
          </span>
        )}
      </div>

      {/* Dezenas - Alinhadas à esquerda */}
      <div className="space-y-1 mb-2">
        <div className="flex flex-wrap gap-1">
          {primeiraLinha.map((dezena) => (
            <span
              key={dezena}
              className="w-7 h-7 flex items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-xs"
            >
              {formatarDezena(dezena)}
            </span>
          ))}
        </div>
        {segundaLinha.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {segundaLinha.map((dezena) => (
              <span
                key={dezena}
                className="w-7 h-7 flex items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-xs"
              >
                {formatarDezena(dezena)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Estatísticas - Linha única neutra */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground border-t border-border/50 pt-2 mt-1">
        <span>Ímp <strong className="text-foreground">{impares}</strong></span>
        <span>Mold <strong className="text-foreground">{moldura}</strong></span>
        <span>Rep <strong className="text-foreground">{repetidas}</strong></span>
        <span>M3 <strong className="text-foreground">{multiplosDe3}</strong></span>
      </div>
    </div>
  );
}
