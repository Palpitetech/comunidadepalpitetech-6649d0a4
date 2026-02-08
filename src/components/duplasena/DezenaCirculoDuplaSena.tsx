import { cn } from "@/lib/utils";
import { isPar, isMoldura, isPrimo } from "@/lib/duplasena";

interface DezenaCirculoDuplaSenaProps {
  dezena: number;
  isRepetida?: boolean;
  showMoldura?: boolean;
  showPrimo?: boolean;
  size?: "sm" | "md" | "lg";
  sorteio?: 1 | 2; // Indica qual sorteio (para contexto visual)
}

export function DezenaCirculoDuplaSena({
  dezena,
  isRepetida = false,
  showMoldura = true,
  showPrimo = true,
  size = "md",
}: DezenaCirculoDuplaSenaProps) {
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
        // Cor base: Par (laranja) ou Ímpar (vermelho) - cores típicas da Dupla Sena
        par
          ? "bg-orange-100 border-duplasena-primary text-orange-700"
          : "bg-red-100 border-duplasena-secondary text-red-700",
        // Se repetida, sobrescreve com azul
        isRepetida && "bg-blue-100 border-blue-500 text-blue-700",
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
