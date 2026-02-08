import { DezenaDesdobramentoMegaSena } from "./DezenaDesdobramentoMegaSena";

interface GridDesdobramentoMegaSenaProps {
  selecionadas: number[];
  fixas: number[];
  excluidas: number[];
  repetidas?: number[];
  modo: "fixar" | "excluir";
  onToggle: (numero: number) => void;
}

export function GridDesdobramentoMegaSena({
  selecionadas,
  fixas,
  excluidas,
  repetidas = [],
  modo,
  onToggle,
}: GridDesdobramentoMegaSenaProps) {
  // Gera os números de 1 a 60 (10 colunas x 6 linhas)
  const dezenas = Array.from({ length: 60 }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-10 gap-1.5">
      {dezenas.map((numero) => (
        <DezenaDesdobramentoMegaSena
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
