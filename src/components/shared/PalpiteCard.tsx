import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { formatarDezena, contarImpares, contarMoldura, contarMultiplosDe3, contarRepetidas } from "@/lib/lotofacil";
import { cn } from "@/lib/utils";
import { Trash2, Copy } from "lucide-react";

export interface PalpiteCardProps {
  /** Número do jogo (índice) */
  index: number;
  /** Array de dezenas do palpite */
  dezenas: number[];
  /** Dezenas do último concurso para calcular repetidas */
  ultimoConcursoDezenas?: number[];
  /** Se o card está selecionado */
  isSelected?: boolean;
  /** Callback ao mudar seleção */
  onSelectChange?: (checked: boolean) => void;
  /** Callback ao excluir */
  onDelete?: () => void;
  /** Callback ao copiar */
  onCopy?: () => void;
  /** Esconder checkbox de seleção */
  hideSelection?: boolean;
  /** Esconder estatísticas */
  hideStats?: boolean;
  /** Label customizado (ao invés de "Jogo XX") */
  label?: string;
  /** Data de criação (opcional) */
  createdAt?: string;
  /** Quantidade de acertos (se já conferido) */
  acertos?: number | null;
}

export function PalpiteCard({
  index,
  dezenas,
  ultimoConcursoDezenas = [],
  isSelected = false,
  onSelectChange,
  onDelete,
  onCopy,
  hideSelection = false,
  hideStats = false,
  label,
  createdAt,
  acertos,
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

  const handleCardClick = () => {
    if (!hideSelection && onSelectChange) {
      onSelectChange(!isSelected);
    }
  };

  const displayLabel = label || `Jogo ${String(index + 1).padStart(2, '0')}`;

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "rounded-xl border p-3 transition-all",
        !hideSelection && "cursor-pointer active:scale-[0.98]",
        isSelected
          ? "border-primary bg-primary/10 shadow-sm"
          : "border-border bg-card"
      )}
    >
      {/* Header com checkbox, título e ações */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {!hideSelection && onSelectChange && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelectChange}
              className="h-5 w-5 shrink-0"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-foreground text-sm">
              {displayLabel}
            </span>
            {createdAt && (
              <span className="text-[10px] text-muted-foreground">
                {new Date(createdAt).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {acertos !== undefined && acertos !== null && (
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full",
              acertos >= 11 ? "bg-green-500/20 text-green-600" : "bg-muted text-muted-foreground"
            )}>
              {acertos} acertos
            </span>
          )}
          {isSelected && !hideSelection && (
            <span className="text-[10px] font-medium text-primary bg-primary/20 px-2 py-0.5 rounded-full">
              Selecionado
            </span>
          )}
          {onCopy && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onCopy();
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
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
      {!hideStats && (
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground border-t border-border/50 pt-2 mt-1">
          <span>Ímp <strong className="text-foreground">{impares}</strong></span>
          <span>Mold <strong className="text-foreground">{moldura}</strong></span>
          {ultimoConcursoDezenas.length > 0 && (
            <span>Rep <strong className="text-foreground">{repetidas}</strong></span>
          )}
          <span>M3 <strong className="text-foreground">{multiplosDe3}</strong></span>
        </div>
      )}
    </div>
  );
}
