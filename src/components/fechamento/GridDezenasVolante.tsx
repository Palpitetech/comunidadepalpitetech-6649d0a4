import { DezenaVolante } from "./DezenaVolante";

interface GridDezenasVolanteProps {
  selecionadas: number[];
  fixas: number[];
  repetidas?: number[];
  modo: "selecionar" | "fixar";
  onToggle: (numero: number) => void;
}

export function GridDezenasVolante({
  selecionadas,
  fixas,
  repetidas = [],
  modo,
  onToggle,
}: GridDezenasVolanteProps) {
  // Gera os números de 1 a 25
  const dezenas = Array.from({ length: 25 }, (_, i) => i + 1);

  const handleClick = (numero: number) => {
    onToggle(numero);
  };

  return (
    <div className="grid grid-cols-5 gap-2">
      {dezenas.map((numero) => (
        <DezenaVolante
          key={numero}
          numero={numero}
          selecionada={selecionadas.includes(numero)}
          fixa={fixas.includes(numero)}
          isRepetida={repetidas.includes(numero)}
          onClick={() => handleClick(numero)}
        />
      ))}
    </div>
  );
}
