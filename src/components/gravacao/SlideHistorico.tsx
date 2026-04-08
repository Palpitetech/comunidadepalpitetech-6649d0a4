import { formatarDezena } from "@/lib/lotofacil";
import type { ConcursoHistorico } from "@/hooks/useGravacaoData";

interface SlideHistoricoProps {
  concursos: ConcursoHistorico[];
}

function MiniGrid({ concurso, dezenas }: { concurso: number; dezenas: number[] }) {
  const sorteadas = new Set(dezenas);

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Concurso number */}
      <span
        className="text-sm font-bold tracking-tight"
        style={{
          background: "linear-gradient(135deg, #A78BFA, #7C3AED)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        #{concurso}
      </span>

      {/* 5x5 grid */}
      <div className="grid grid-cols-5 gap-[3px]">
        {Array.from({ length: 25 }, (_, i) => i + 1).map((num) => {
          const isSorteada = sorteadas.has(num);
          return (
            <div
              key={num}
              className={`
                w-7 h-7 rounded-md flex items-center justify-center
                text-[11px] font-bold
                ${isSorteada ? "text-white" : "bg-white/5 text-white/15"}
              `}
              style={
                isSorteada
                  ? {
                      background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                      boxShadow: "0 2px 8px rgba(124, 58, 237, 0.25)",
                    }
                  : undefined
              }
            >
              {formatarDezena(num)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SlideHistorico({ concursos }: SlideHistoricoProps) {
  // Show up to 12 concursos in a 4 cols x 3 rows layout
  const items = concursos.slice(0, 12);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-5">
      <h2 className="text-purple-300/70 text-xl md:text-2xl font-medium tracking-wide">
        Últimos Concursos
      </h2>

      <div className="grid grid-cols-4 gap-x-6 gap-y-5">
        {items.map((c) => (
          <MiniGrid key={c.concurso} concurso={c.concurso} dezenas={c.dezenas} />
        ))}
      </div>
    </div>
  );
}
