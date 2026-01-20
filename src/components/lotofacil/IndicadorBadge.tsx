import { cn } from "@/lib/utils";

interface IndicadorBadgeProps {
  label: string;
  value: number;
  tipo: "pares" | "impares" | "moldura" | "primos" | "repetidas";
  className?: string;
}

const tipoStyles = {
  pares: "bg-blue-100 text-blue-700 border-blue-300",
  impares: "bg-purple-100 text-purple-700 border-purple-300",
  moldura: "bg-amber-100 text-amber-700 border-amber-300",
  primos: "bg-green-100 text-green-700 border-green-300",
  repetidas: "bg-red-100 text-red-700 border-red-300",
};

const tipoIcons = {
  pares: "🔵",
  impares: "🟣",
  moldura: "🟡",
  primos: "🟢",
  repetidas: "🔴",
};

export function IndicadorBadge({ label, value, tipo, className }: IndicadorBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full text-senior-sm font-semibold border",
        tipoStyles[tipo],
        className
      )}
    >
      <span>{tipoIcons[tipo]}</span>
      <span>{label}:</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
