import { DezenaDesdobramento } from "./DezenaDesdobramento";

interface GridDesdobramentoProps {
  selecionadas: number[];
  fixas: number[];
  excluidas: number[];
  repetidas?: number[];
  modo: "fixar" | "excluir";
  onToggle: (numero: number) => void;
}

export function GridDesdobramento({
  selecionadas,
  fixas,
  excluidas,
  repetidas = [],
  modo,
  onToggle,
}: GridDesdobramentoProps) {
  // Gera os números de 1 a 25
  const dezenas = Array.from({ length: 25 }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-5 gap-2.5">
      {dezenas.map((numero) => (
        <DezenaDesdobramento
          key={numero}
          numero={numero}
          selecionada={selecionadas.includes(numero)}
          fixa={fixas.includes(numero)}
          excluida={excluidas.includes(numero)}
          isRepetida={repetidas.includes(numero)}
          onClick={() => onToggle(numero)}
        />
      ))}
    </div>
  );
}
