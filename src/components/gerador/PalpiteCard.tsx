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

  // Dividir dezenas em 2 linhas (metade em cada)
  const metade = Math.ceil(dezenas.length / 2);
  const primeiraLinha = dezenas.slice(0, metade);
  const segundaLinha = dezenas.slice(metade);

  return (
    <div
      className={cn(
        "rounded-xl border-2 p-3 transition-all",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-muted-foreground/30"
      )}
    >
      {/* Header com checkbox */}
      <div className="flex items-center gap-2 mb-2">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelectChange}
          className="h-5 w-5 shrink-0"
        />
        <span className="font-semibold text-foreground text-sm">
          Palpite {index + 1}
        </span>
      </div>

      {/* Dezenas - Grid fixo para mobile */}
      <div className="space-y-1.5 mb-2">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(28px,1fr))] gap-1 max-w-[320px] mx-auto">
          {primeiraLinha.map((dezena) => (
            <span
              key={dezena}
              className="aspect-square flex items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-xs min-w-[28px] max-w-[36px]"
            >
              {formatarDezena(dezena)}
            </span>
          ))}
        </div>
        {segundaLinha.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(28px,1fr))] gap-1 max-w-[320px] mx-auto">
            {segundaLinha.map((dezena) => (
              <span
                key={dezena}
                className="aspect-square flex items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-xs min-w-[28px] max-w-[36px]"
              >
                {formatarDezena(dezena)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Estatísticas - Uma única linha */}
      <div className="flex items-center justify-between gap-1 text-[10px] text-muted-foreground">
        <span>Ímp: <strong className="text-foreground">{impares}</strong></span>
        <span>Mold: <strong className="text-foreground">{moldura}</strong></span>
        <span>Rep: <strong className="text-foreground">{repetidas}</strong></span>
        <span>M3: <strong className="text-foreground">{multiplosDe3}</strong></span>
      </div>
    </div>
  );
}
