import { DezenaVolante } from "./DezenaVolante";

interface GridDezenasVolanteProps {
  selecionadas: number[];
  fixas: number[];
  modo: "selecionar" | "fixar";
  onToggle: (numero: number) => void;
  maxSelecionadas?: number;
  maxFixas?: number;
}

export function GridDezenasVolante({
  selecionadas,
  fixas,
  modo,
  onToggle,
  maxSelecionadas,
  maxFixas
}: GridDezenasVolanteProps) {
  // Gera os números de 1 a 25
  const dezenas = Array.from({ length: 25 }, (_, i) => i + 1);

  const handleClick = (numero: number) => {
    // Verifica limites antes de adicionar
    if (modo === "selecionar") {
      const estaSelecionada = selecionadas.includes(numero);
      if (!estaSelecionada && maxSelecionadas && selecionadas.length >= maxSelecionadas) {
        return; // Já atingiu o limite
      }
    } else {
      const estaFixa = fixas.includes(numero);
      if (!estaFixa && maxFixas && fixas.length >= maxFixas) {
        return; // Já atingiu o limite de fixas
      }
    }
    onToggle(numero);
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="grid grid-cols-5 gap-2">
        {dezenas.map((numero) => (
          <DezenaVolante
            key={numero}
            numero={numero}
            selecionada={selecionadas.includes(numero)}
            fixa={fixas.includes(numero)}
            onClick={() => handleClick(numero)}
          />
        ))}
      </div>
      
      {/* Legenda */}
      <div className="mt-4 flex flex-wrap gap-3 justify-center text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="text-purple-600 dark:text-purple-400 font-semibold">I</span>
          <span>Ímpar</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-blue-600 dark:text-blue-400 font-semibold">P</span>
          <span>Par</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-amber-600 dark:text-amber-400 font-semibold">M</span>
          <span>Moldura</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-green-600 dark:text-green-400 font-semibold">M3</span>
          <span>Múltiplo 3</span>
        </div>
      </div>
    </div>
  );
}
