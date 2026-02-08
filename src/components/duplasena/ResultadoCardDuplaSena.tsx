import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DezenaCirculoDuplaSena } from "./DezenaCirculoDuplaSena";
import { Badge } from "@/components/ui/badge";

interface ResultadoCardDuplaSenaProps {
  concursoId: number;
  dataSorteio: string;
  dezenasSorteio1: number[];
  dezenasSorteio2: number[];
  acumulou?: boolean;
  qtdParesS1?: number;
  qtdImparesS1?: number;
  qtdMolduraS1?: number;
  qtdPrimosS1?: number;
  qtdRepetidasS1?: number;
  qtdParesS2?: number;
  qtdImparesS2?: number;
  qtdMolduraS2?: number;
  qtdPrimosS2?: number;
  qtdRepetidasS2?: number;
  dezenasSorteio1Anterior?: number[];
  dezenasSorteio2Anterior?: number[];
  onClick?: () => void;
}

export function ResultadoCardDuplaSena({
  concursoId,
  dataSorteio,
  dezenasSorteio1,
  dezenasSorteio2,
  acumulou,
  qtdParesS1,
  qtdRepetidasS1,
  qtdMolduraS1,
  qtdPrimosS1,
  qtdParesS2,
  qtdRepetidasS2,
  dezenasSorteio1Anterior = [],
  dezenasSorteio2Anterior = [],
  onClick,
}: ResultadoCardDuplaSenaProps) {
  const dataFormatada = format(parseISO(dataSorteio), "dd/MM/yyyy", {
    locale: ptBR,
  });

  const dezenas1Ordenadas = [...dezenasSorteio1].sort((a, b) => a - b);
  const dezenas2Ordenadas = [...dezenasSorteio2].sort((a, b) => a - b);
  
  // Identificar repetidas
  const repetidasS1 = dezenasSorteio1Anterior.length > 0
    ? dezenas1Ordenadas.filter((d) => dezenasSorteio1Anterior.includes(d))
    : [];
  const repetidasS2 = dezenasSorteio2Anterior.length > 0
    ? dezenas2Ordenadas.filter((d) => dezenasSorteio2Anterior.includes(d))
    : [];

  return (
    <div
      className="bg-card rounded-lg p-3 border hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* Header: Concurso e Data */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-duplasena-primary">#{concursoId}</span>
          <span className="text-xs text-muted-foreground">{dataFormatada}</span>
        </div>
        {acumulou && (
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
            Acumulou
          </Badge>
        )}
      </div>

      {/* Sorteio 1 */}
      <div className="mb-3">
        <div className="text-xs font-medium text-duplasena-primary mb-1.5 flex items-center gap-1">
          <span className="w-5 h-5 rounded-full bg-duplasena-primary text-white flex items-center justify-center text-[10px] font-bold">1</span>
          Sorteio 1
        </div>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {dezenas1Ordenadas.map((dezena) => (
            <DezenaCirculoDuplaSena
              key={`s1-${dezena}`}
              dezena={dezena}
              isRepetida={repetidasS1.includes(dezena)}
              size="sm"
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground justify-center mt-1">
          {qtdParesS1 !== undefined && (
            <span>P: <strong className="text-foreground">{qtdParesS1}</strong></span>
          )}
          {qtdRepetidasS1 !== undefined && qtdRepetidasS1 > 0 && (
            <span>Rep: <strong className="text-blue-600">{qtdRepetidasS1}</strong></span>
          )}
          {qtdMolduraS1 !== undefined && (
            <span>M: <strong className="text-foreground">{qtdMolduraS1}</strong></span>
          )}
          {qtdPrimosS1 !== undefined && (
            <span>Pr: <strong className="text-foreground">{qtdPrimosS1}</strong></span>
          )}
        </div>
      </div>

      {/* Divisor */}
      <div className="border-t border-dashed my-2" />

      {/* Sorteio 2 */}
      <div>
        <div className="text-xs font-medium text-duplasena-secondary mb-1.5 flex items-center gap-1">
          <span className="w-5 h-5 rounded-full bg-duplasena-secondary text-white flex items-center justify-center text-[10px] font-bold">2</span>
          Sorteio 2
        </div>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {dezenas2Ordenadas.map((dezena) => (
            <DezenaCirculoDuplaSena
              key={`s2-${dezena}`}
              dezena={dezena}
              isRepetida={repetidasS2.includes(dezena)}
              size="sm"
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground justify-center mt-1">
          {qtdParesS2 !== undefined && (
            <span>P: <strong className="text-foreground">{qtdParesS2}</strong></span>
          )}
          {qtdRepetidasS2 !== undefined && qtdRepetidasS2 > 0 && (
            <span>Rep: <strong className="text-blue-600">{qtdRepetidasS2}</strong></span>
          )}
        </div>
      </div>
    </div>
  );
}
