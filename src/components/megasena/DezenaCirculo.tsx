import { cn } from "@/lib/utils";
import { isPar, isMoldura, isPrimo } from "@/lib/megasena";

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
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold border-2 transition-all duration-200",
        sizeClasses[size],
        // Cor base: Par (verde) ou Ímpar (laranja) - cores típicas da Mega Sena
        par
          ? "bg-green-100 border-green-500 text-green-700"
          : "bg-orange-100 border-orange-500 text-orange-700",
        // Se repetida, sobrescreve com vermelho
        isRepetida && "bg-red-100 border-red-500 text-red-700",
        // Moldura: adiciona anel dourado
        showMoldura && moldura && "ring-2 ring-offset-1 ring-amber-400",
        // Primo: adiciona sombra verde
        showPrimo && primo && "shadow-lg shadow-emerald-400/50"
      )}
      title={`Dezena ${dezena.toString().padStart(2, "0")}${par ? " (Par)" : " (Ímpar)"}${moldura ? " - Moldura" : ""}${primo ? " - Primo" : ""}${isRepetida ? " - Repetida" : ""}`}
    >
      {dezena.toString().padStart(2, "0")}
    </div>
  );
}
