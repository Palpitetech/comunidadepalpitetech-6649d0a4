import { DezenaDesdobramentoDuplaSena } from "./DezenaDesdobramentoDuplaSena";

interface GridDesdobramentoDuplaSenaProps {
  selecionadas: number[];
  fixas: number[];
  excluidas: number[];
  repetidas?: number[];
  modo: "fixar" | "excluir";
  onToggle: (numero: number) => void;
}

export function GridDesdobramentoDuplaSena({
  selecionadas,
  fixas,
  excluidas,
  repetidas = [],
  modo,
  onToggle,
}: GridDesdobramentoDuplaSenaProps) {
  // Gera os números de 1 a 50 (10 colunas x 5 linhas)
  const dezenas = Array.from({ length: 50 }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-10 gap-1">
      {dezenas.map((numero) => (
        <DezenaDesdobramentoDuplaSena
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
