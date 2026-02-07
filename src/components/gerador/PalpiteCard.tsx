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

  // Dividir dezenas em linhas (8 + resto)
  const primeiraLinha = dezenas.slice(0, 8);
  const segundaLinha = dezenas.slice(8);

  return (
    <div
      className={cn(
        "rounded-xl border-2 p-4 transition-all",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-muted-foreground/30"
      )}
    >
      {/* Header com checkbox */}
      <div className="flex items-center gap-3 mb-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelectChange}
          className="h-5 w-5"
        />
        <span className="font-semibold text-foreground">
          Palpite {index + 1}
        </span>
      </div>

      {/* Dezenas */}
      <div className="space-y-2 mb-3">
        <div className="flex flex-wrap justify-center gap-1.5">
          {primeiraLinha.map((dezena) => (
            <span
              key={dezena}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm"
            >
              {formatarDezena(dezena)}
            </span>
          ))}
        </div>
        {segundaLinha.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5">
            {segundaLinha.map((dezena) => (
              <span
                key={dezena}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm"
              >
                {formatarDezena(dezena)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Estatísticas */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>Ímpares: <strong className="text-foreground">{impares}</strong></span>
        <span className="text-border">|</span>
        <span>Moldura: <strong className="text-foreground">{moldura}</strong></span>
        <span className="text-border">|</span>
        <span>Repetidas: <strong className="text-foreground">{repetidas}</strong></span>
        <span className="text-border">|</span>
        <span>Múlt.3: <strong className="text-foreground">{multiplosDe3}</strong></span>
      </div>
    </div>
  );
}
