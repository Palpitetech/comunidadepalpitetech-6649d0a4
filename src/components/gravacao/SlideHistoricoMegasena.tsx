import { formatarDezena } from "@/lib/megasena";
import type { ConcursoHistorico } from "@/hooks/useGravacaoData";

interface SlideHistoricoMegasenaProps {
  concursos: ConcursoHistorico[];
}

function MiniGridMegasena({ concurso, dezenas }: { concurso: number; dezenas: number[] }) {
  const sorteadas = new Set(dezenas);

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="text-xs font-bold tracking-tight"
        style={{
          background: "linear-gradient(135deg, #34D399, #10B981)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        #{concurso}
      </span>

      {/* Compact 6x10 grid */}
      <div className="grid grid-cols-10 gap-[2px]" style={{ width: "140px" }}>
        {Array.from({ length: 60 }, (_, i) => i + 1).map((num) => {
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
                      background: "linear-gradient(135deg, #10B981, #059669)",
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

export default function SlideHistoricoMegasena({ concursos = [] }: SlideHistoricoMegasenaProps) {
  const items = (concursos ?? []).slice(0, 12);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-4">
      <h2 className="text-emerald-300/70 text-xl md:text-2xl font-medium tracking-wide">
        Últimos Concursos
      </h2>

      <div className="grid grid-cols-4 gap-x-5 gap-y-4">
        {items.map((c) => (
          <MiniGridMegasena key={c.concurso} concurso={c.concurso} dezenas={c.dezenas} />
        ))}
      </div>
    </div>
  );
}
