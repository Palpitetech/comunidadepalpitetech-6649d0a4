import type { FaixaPremiacao, ProximoConcursoInfo } from "@/hooks/useGravacaoData";

interface SlideIntroProps {
  concurso: number;
  data: string;
  premiacao: string;
  faixasPremiacao: FaixaPremiacao[];
  proximoConcurso?: ProximoConcursoInfo;
}

export default function SlideIntro({ concurso, data, premiacao, faixasPremiacao, proximoConcurso }: SlideIntroProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center w-full h-full">
      <p className="text-purple-400 text-lg tracking-[0.3em] uppercase font-medium">
        Resultado
      </p>
      <h1
        className="text-7xl md:text-9xl font-extrabold tracking-tight leading-none"
        style={{
          background: "linear-gradient(135deg, #A78BFA, #7C3AED, #6D28D9)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        LOTOFÁCIL
      </h1>
      <div className="flex items-center gap-3">
        <span className="text-white/60 text-2xl md:text-3xl">Concurso</span>
        <span className="text-purple-300 font-bold text-4xl md:text-5xl">{concurso}</span>
      </div>
      <p className="text-white/50 text-base md:text-lg capitalize">{data}</p>

      <div
        className="mt-2 rounded-2xl px-10 py-5"
        style={{
          background: "rgba(124, 58, 237, 0.1)",
          border: "1px solid rgba(124, 58, 237, 0.3)",
        }}
      >
        <p className="text-purple-400 text-sm uppercase tracking-wider mb-1">
          Premiação Total
        </p>
        <p
          className="text-3xl md:text-5xl font-bold"
          style={{
            background: "linear-gradient(135deg, #C4B5FD, #A78BFA)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {premiacao}
        </p>
      </div>

      {faixasPremiacao.length > 0 && (
        <div className="w-full max-w-lg space-y-1 mt-1">
          {faixasPremiacao.map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg px-4 py-1.5"
              style={{
                background: "rgba(124, 58, 237, 0.08)",
                border: "1px solid rgba(124, 58, 237, 0.15)",
              }}
            >
              <span className="text-purple-300 text-xs font-semibold min-w-[90px] text-left">
                {f.faixa}
              </span>
              <span className="text-white/50 text-xs min-w-[80px]">
                {f.ganhadores.toLocaleString("pt-BR")} {f.ganhadores === 1 ? "ganhador" : "ganhadores"}
              </span>
              <span className="text-purple-200 text-xs font-bold">
                {f.valorPremioFormatado}
              </span>
            </div>
          ))}
        </div>
      )}

      {proximoConcurso?.premioEstimadoFormatado && (
        <div
          className="mt-3 rounded-2xl px-8 py-4 w-full max-w-lg text-center"
          style={{
            background: "linear-gradient(135deg, rgba(124, 58, 237, 0.18), rgba(167, 139, 250, 0.10))",
            border: "1px solid rgba(167, 139, 250, 0.35)",
          }}
        >
          <p className="text-purple-300 text-xs uppercase tracking-[0.2em] mb-1">
            Próximo Concurso{proximoConcurso.numero ? ` ${proximoConcurso.numero}` : ""}
            {proximoConcurso.acumulado ? " · Acumulado" : ""}
          </p>
          <p
            className="text-2xl md:text-4xl font-extrabold"
            style={{
              background: "linear-gradient(135deg, #DDD6FE, #A78BFA)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {proximoConcurso.premioEstimadoFormatado}
          </p>
          {proximoConcurso.data && (
            <p className="text-white/50 text-xs capitalize mt-1">{proximoConcurso.data}</p>
          )}
        </div>
      )}
    </div>
  );
}
