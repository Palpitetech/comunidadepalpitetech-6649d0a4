import { cn } from "@/lib/utils";
import { DezenaCirculoMini } from "./DezenaCirculoMini";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ResultadoCardProps {
  resultado: {
    concurso_id: number;
    data_sorteio: string;
    dezenas: number[];
    qtd_pares: number | null;
    qtd_impares: number | null;
    qtd_moldura: number | null;
    qtd_primos: number | null;
    qtd_repetidas: number | null;
  };
  onClick: () => void;
}

export function ResultadoCard({ resultado, onClick }: ResultadoCardProps) {
  const dataFormatada = format(parseISO(resultado.data_sorteio), "dd/MM/yyyy", {
    locale: ptBR,
  });

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left py-4 px-2",
        "hover:bg-accent/30 transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        "cursor-pointer"
      )}
    >
      <div className="flex gap-3">
        {/* Lado esquerdo: Concurso e Data */}
        <div className="flex flex-col items-start min-w-[72px]">
          <span className="text-primary font-bold text-base">
            #{resultado.concurso_id}
          </span>
          <span className="text-muted-foreground text-sm">
            {dataFormatada}
          </span>
        </div>

        {/* Lado direito: Dezenas e Indicadores */}
        <div className="flex-1 flex flex-col gap-2">
          {/* Grid de dezenas */}
          <div className="flex flex-wrap gap-1">
            {resultado.dezenas.map((dezena, index) => (
              <DezenaCirculoMini key={index} dezena={dezena} />
            ))}
          </div>

          {/* Indicadores resumidos */}
          <div className="text-xs text-muted-foreground">
            I:{resultado.qtd_impares ?? "-"} | P:{resultado.qtd_pares ?? "-"} | M:{resultado.qtd_moldura ?? "-"} | Pr:{resultado.qtd_primos ?? "-"} | R:{resultado.qtd_repetidas ?? "-"}
          </div>
        </div>
      </div>
    </button>
  );
}
