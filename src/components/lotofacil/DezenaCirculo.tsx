import { cn } from "@/lib/utils";
import { isPar, isMoldura, isPrimo } from "@/lib/lotofacil";

interface DezenaCirculoProps {
  dezena: number;
  isRepetida?: boolean;
  showMoldura?: boolean;
  showPrimo?: boolean;
  size?: "sm" | "md" | "lg";
}

export function DezenaCirculo({
  dezena,
  isRepetida = false,
  showMoldura = true,
  showPrimo = true,
  size = "md",
}: DezenaCirculoProps) {
  const par = isPar(dezena);
  const moldura = isMoldura(dezena);
  const primo = isPrimo(dezena);

  const sizeClasses = {
    sm: "w-10 h-10 text-base",
    md: "w-12 h-12 text-lg",
    lg: "w-14 h-14 text-xl",
  };

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold border-2 transition-all duration-200",
        sizeClasses[size],
        // Cor base: Par (azul) ou Ímpar (roxo)
        par
          ? "bg-blue-100 border-blue-500 text-blue-700"
          : "bg-purple-100 border-purple-500 text-purple-700",
        // Se repetida, sobrescreve com vermelho
        isRepetida && "bg-red-100 border-red-500 text-red-700",
        // Moldura: adiciona anel dourado
        showMoldura && moldura && "ring-2 ring-offset-2 ring-amber-400",
        // Primo: adiciona sombra verde
        showPrimo && primo && "shadow-lg shadow-green-400/50"
      )}
      title={`Dezena ${dezena.toString().padStart(2, "0")}${par ? " (Par)" : " (Ímpar)"}${moldura ? " - Moldura" : ""}${primo ? " - Primo" : ""}${isRepetida ? " - Repetida" : ""}`}
    >
      {dezena.toString().padStart(2, "0")}
    </div>
  );
}
