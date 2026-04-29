interface Props {
  trio: number[];
  premioEstimado?: string;
  proximoConcurso?: number;
}

const CHECKLIST = [
  "Combine o trio com 3 dezenas baixas (P1 — P3)",
  "Evite repetir P6 abaixo de 30",
  "Inclua ao menos 1 dezena ≥ 50",
  "Confira se a soma final fica entre 150 e 220",
];

export default function Slide6Conclusao({ trio, premioEstimado, proximoConcurso }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full h-full max-w-6xl mx-auto">
      <div className="text-center">
        <p className="text-purple-400 text-sm tracking-[0.4em] uppercase font-medium mb-3">
          Conclusão Estratégica
        </p>
        <h2 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight">
          Trio recomendado
        </h2>
        <p className="text-white/55 text-lg md:text-xl mt-3 max-w-3xl mx-auto">
          As dezenas mais decisivas das posições 4, 5 e 6
        </p>
      </div>

      {/* Trio em círculos grandes */}
      <div className="flex items-center justify-center gap-6 md:gap-10">
        {trio.map((dez, i) => (
          <div key={i} className="flex flex-col items-center gap-3">
            <div
              className="rounded-full flex items-center justify-center relative"
              style={{
                width: 180,
                height: 180,
                background: "linear-gradient(145deg, #1E1B4B, #0F0A2E)",
                border: "3px solid #7C3AED",
                boxShadow: "0 0 60px rgba(124, 58, 237, 0.55), inset 0 0 30px rgba(124, 58, 237, 0.2)",
              }}
            >
              <span
                className="text-7xl font-extrabold"
                style={{
                  color: "#F9FAFB",
                  textShadow: "0 0 25px rgba(167, 139, 250, 0.7)",
                }}
              >
                {String(dez).padStart(2, "0")}
              </span>
            </div>
            <span className="text-purple-300/70 text-sm font-bold tracking-[0.3em] uppercase">
              P{i + 4}
            </span>
          </div>
        ))}
      </div>

      {/* Checklist */}
      <div
        className="rounded-2xl p-6 max-w-3xl w-full"
        style={{
          background: "#111827",
          border: "1px solid #1F2937",
        }}
      >
        <p className="text-emerald-400 text-xs uppercase tracking-[0.3em] font-bold mb-4 text-center">
          Checklist Estratégico
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CHECKLIST.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                style={{
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                }}
              >
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-white/85 text-base md:text-lg leading-snug">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Próximo prêmio */}
      {premioEstimado && (
        <div
          className="rounded-2xl px-8 py-4 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(167, 139, 250, 0.05))",
            border: "1px solid rgba(124, 58, 237, 0.35)",
            boxShadow: "0 0 50px rgba(124, 58, 237, 0.2)",
          }}
        >
          <p className="text-purple-300 text-xs uppercase tracking-[0.3em] mb-1">
            Próximo Concurso{proximoConcurso ? ` · ${proximoConcurso}` : ""}
          </p>
          <p
            className="text-3xl md:text-5xl font-extrabold"
            style={{
              background: "linear-gradient(135deg, #FFFFFF, #C4B5FD)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {premioEstimado}
          </p>
        </div>
      )}
    </div>
  );
}
