import type { FaixaPremiacao } from "@/hooks/useGravacaoData";

interface SlideIntroMegasenaProps {
  concurso: number;
  data: string;
  premiacao: string;
  faixasPremiacao: FaixaPremiacao[];
}

export default function SlideIntroMegasena({ concurso, data, premiacao, faixasPremiacao }: SlideIntroMegasenaProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center w-full h-full">
      <p className="text-emerald-400 text-lg tracking-[0.3em] uppercase font-medium">
        Resultado
      </p>
      <h1
        className="text-7xl md:text-9xl font-extrabold tracking-tight leading-none"
        style={{
          background: "linear-gradient(135deg, #34D399, #10B981, #059669)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        MEGA-SENA
      </h1>
      <div className="flex items-center gap-3">
        <span className="text-white/60 text-2xl md:text-3xl">Concurso</span>
        <span className="text-emerald-300 font-bold text-4xl md:text-5xl">{concurso}</span>
      </div>
      <p className="text-white/50 text-base md:text-lg capitalize">{data}</p>

      <div
        className="mt-2 rounded-2xl px-10 py-5"
        style={{
          background: "rgba(16, 185, 129, 0.1)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
        }}
      >
        <p className="text-emerald-400 text-sm uppercase tracking-wider mb-1">
          Premiação Total
        </p>
        <p
          className="text-3xl md:text-5xl font-bold"
          style={{
            background: "linear-gradient(135deg, #A7F3D0, #34D399)",
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
                background: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.15)",
              }}
            >
              <span className="text-emerald-300 text-xs font-semibold min-w-[90px] text-left">
                {f.faixa}
              </span>
              <span className="text-white/50 text-xs min-w-[80px]">
                {f.ganhadores.toLocaleString("pt-BR")} {f.ganhadores === 1 ? "ganhador" : "ganhadores"}
              </span>
              <span className="text-emerald-200 text-xs font-bold">
                {f.valorPremioFormatado}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
