import { DezenaDesdobramentoQuina } from "./DezenaDesdobramentoQuina";

interface GridDesdobramentoQuinaProps {
  selecionadas: number[];
  fixas: number[];
  excluidas: number[];
  repetidas?: number[];
  modo: "fixar" | "excluir";
  onToggle: (numero: number) => void;
}

export function GridDesdobramentoQuina({
  selecionadas,
  fixas,
  excluidas,
  repetidas = [],
  modo,
  onToggle,
}: GridDesdobramentoQuinaProps) {
  // 80 dezenas em grid 10 colunas x 8 linhas
  const dezenas = Array.from({ length: 80 }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-10 gap-1">
      {dezenas.map((numero) => (
        <DezenaDesdobramentoQuina
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
