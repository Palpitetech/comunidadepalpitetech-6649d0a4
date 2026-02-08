import { cn } from "@/lib/utils";
import { formatarDezena } from "@/lib/lotofacil";

interface JogoCardProps {
  jogo: number[];
  index: number;
}

export function JogoCard({ jogo, index }: JogoCardProps) {
  // Ordenar as dezenas
  const dezenasOrdenadas = [...jogo].sort((a, b) => a - b);

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Jogo {index + 1}
        </span>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {dezenasOrdenadas.length} números
        </span>
      </div>
      
      <div className="flex flex-wrap gap-1.5">
        {dezenasOrdenadas.map((dezena) => (
          <span
            key={dezena}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              "text-sm font-bold",
              "bg-primary text-primary-foreground"
            )}
          >
            {formatarDezena(dezena)}
          </span>
        ))}
      </div>
    </div>
  );
}
