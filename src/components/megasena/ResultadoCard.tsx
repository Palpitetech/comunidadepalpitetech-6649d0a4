import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DezenaCirculo } from "./DezenaCirculo";
import { Badge } from "@/components/ui/badge";

interface ResultadoCardProps {
  concursoId: number;
  dataSorteio: string;
  dezenas: number[];
  acumulou?: boolean;
  qtdPares?: number;
  qtdImpares?: number;
  qtdMoldura?: number;
  qtdPrimos?: number;
  qtdRepetidas?: number;
  dezenasAnteriores?: number[];
  onClick?: () => void;
}

export function ResultadoCard({
  concursoId,
  dataSorteio,
  dezenas,
  acumulou,
  qtdPares,
  qtdImpares,
  qtdMoldura,
  qtdPrimos,
  qtdRepetidas,
  dezenasAnteriores = [],
  onClick,
}: ResultadoCardProps) {
  const dataFormatada = format(parseISO(dataSorteio), "dd/MM/yyyy", {
    locale: ptBR,
  });

  const dezenasOrdenadas = [...dezenas].sort((a, b) => a - b);
  
  // Identificar repetidas
  const repetidas = dezenasAnteriores.length > 0
    ? dezenasOrdenadas.filter((d) => dezenasAnteriores.includes(d))
    : [];

  return (
    <div
      className="bg-card rounded-lg p-3 border hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* Header: Concurso e Data */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-primary">#{concursoId}</span>
          <span className="text-xs text-muted-foreground">{dataFormatada}</span>
        </div>
        {acumulou && (
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
            Acumulou
          </Badge>
        )}
      </div>

      {/* Grid de Dezenas - 6 em linha única */}
      <div className="flex flex-wrap gap-1.5 justify-center mb-3">
        {dezenasOrdenadas.map((dezena) => (
          <DezenaCirculo
            key={dezena}
            dezena={dezena}
            isRepetida={repetidas.includes(dezena)}
            size="md"
          />
        ))}
      </div>

      {/* Indicadores */}
      <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground justify-center">
        {qtdPares !== undefined && (
          <span>Pares: <strong className="text-foreground">{qtdPares}</strong></span>
        )}
        {qtdRepetidas !== undefined && qtdRepetidas > 0 && (
          <span>Repetidas: <strong className="text-red-600">{qtdRepetidas}</strong></span>
        )}
        {qtdMoldura !== undefined && (
          <span>Moldura: <strong className="text-foreground">{qtdMoldura}</strong></span>
        )}
        {qtdPrimos !== undefined && (
          <span>Primos: <strong className="text-foreground">{qtdPrimos}</strong></span>
        )}
      </div>
    </div>
  );
}
