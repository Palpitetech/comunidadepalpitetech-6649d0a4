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

  // Dividir dezenas: 8 na primeira linha, 7 na segunda
  const primeiraLinha = resultado.dezenas.slice(0, 8);
  const segundaLinha = resultado.dezenas.slice(8, 15);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full py-3 px-1",
        "hover:bg-accent/20 transition-colors",
        "focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/30",
        "cursor-pointer"
      )}
    >
      {/* Topo: Concurso e Data na mesma linha */}
      <div className="text-center mb-2">
        <span className="text-xs text-muted-foreground">
          #{resultado.concurso_id} — {dataFormatada}
        </span>
      </div>

      {/* Grid de Dezenas: 2 linhas centralizadas */}
      <div className="flex flex-col items-center gap-1 mb-2">
        {/* Linha 1: 8 dezenas */}
        <div className="flex justify-center gap-1">
          {primeiraLinha.map((dezena, index) => (
            <DezenaCirculoMini key={index} dezena={dezena} />
          ))}
        </div>
        {/* Linha 2: 7 dezenas */}
        <div className="flex justify-center gap-1">
          {segundaLinha.map((dezena, index) => (
            <DezenaCirculoMini key={index + 8} dezena={dezena} />
          ))}
        </div>
      </div>

      {/* Rodapé: Parâmetros com palavras completas */}
      <div className="text-center text-sm text-muted-foreground">
        Ímpares: {resultado.qtd_impares ?? "-"} | Repetidas: {resultado.qtd_repetidas ?? "-"} | Moldura: {resultado.qtd_moldura ?? "-"} | Primos: {resultado.qtd_primos ?? "-"}
      </div>
    </button>
  );
}
