import { formatarDezena } from "@/lib/quina";
import type { ConcursoHistorico } from "@/hooks/useGravacaoData";

interface SlideHistoricoQuinaProps {
  concursos: ConcursoHistorico[];
}

function MiniGridQuina({ concurso, dezenas }: { concurso: number; dezenas: number[] }) {
  const sorteadas = new Set(dezenas);

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="text-xs font-bold tracking-tight"
        style={{
          background: "linear-gradient(135deg, #818CF8, #6366F1)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        #{concurso}
      </span>

      {/* Compact display: just show the 5 sorted numbers */}
      <div className="flex gap-[2px] flex-wrap justify-center" style={{ maxWidth: "130px" }}>
        {Array.from({ length: 80 }, (_, i) => i + 1).map((num) => {
          const isSorteada = sorteadas.has(num);
          return (
            <div
              key={num}
              className={`
                w-[12px] h-[12px] rounded-[2px] flex items-center justify-center
                text-[5px] font-bold
                ${isSorteada ? "text-white" : "bg-white/[0.03] text-transparent"}
              `}
              style={
                isSorteada
                  ? {
                      background: "linear-gradient(135deg, #6366F1, #4F46E5)",
                    }
                  : undefined
              }
            >
              {isSorteada ? formatarDezena(num) : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SlideHistoricoQuina({ concursos = [] }: SlideHistoricoQuinaProps) {
  const items = (concursos ?? []).slice(0, 12);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-4">
      <h2 className="text-indigo-300/70 text-xl md:text-2xl font-medium tracking-wide">
        Últimos Concursos
      </h2>

      <div className="grid grid-cols-4 gap-x-5 gap-y-4">
        {items.map((c) => (
          <MiniGridQuina key={c.concurso} concurso={c.concurso} dezenas={c.dezenas} />
        ))}
      </div>
    </div>
  );
}
