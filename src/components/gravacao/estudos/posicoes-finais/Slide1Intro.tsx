interface Props {
  concurso?: number;
  data?: string;
}

export default function Slide1Intro({ concurso, data }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 text-center w-full h-full animate-fade-in">
      <div className="animate-scale-in">
        <p className="text-purple-400 text-base md:text-lg tracking-[0.4em] uppercase font-medium mb-6">
          Estudo Estatístico · Mega-Sena
        </p>
        <h1
          className="text-6xl md:text-8xl font-extrabold tracking-tight leading-[0.95] max-w-5xl"
          style={{
            background: "linear-gradient(135deg, #FFFFFF 0%, #C4B5FD 50%, #7C3AED 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0 0 80px rgba(124, 58, 237, 0.3)",
          }}
        >
          Posições Finais<br />da Mega-Sena
        </h1>
      </div>

      <p className="text-white/60 text-xl md:text-2xl max-w-3xl mt-2 leading-relaxed">
        Análise das dezenas que mais aparecem nas <span className="text-purple-300 font-semibold">posições 4, 5 e 6</span> dos sorteios
      </p>

      <div className="flex items-center gap-4 mt-6">
        <div
          className="rounded-2xl px-8 py-4"
          style={{
            background: "rgba(124, 58, 237, 0.1)",
            border: "1px solid rgba(124, 58, 237, 0.3)",
            boxShadow: "0 0 60px rgba(124, 58, 237, 0.15)",
          }}
        >
          <p className="text-purple-300 text-xs uppercase tracking-[0.25em] mb-1">
            Base de Análise
          </p>
          <p className="text-3xl md:text-4xl font-bold text-white">
            Últimos 100 concursos
          </p>
        </div>

        {concurso && (
          <div
            className="rounded-2xl px-8 py-4"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <p className="text-white/40 text-xs uppercase tracking-[0.25em] mb-1">
              Concurso de referência
            </p>
            <p className="text-3xl md:text-4xl font-bold text-white">
              #{concurso}
            </p>
            {data && <p className="text-white/40 text-sm capitalize mt-1">{data}</p>}
          </div>
        )}
      </div>

      <p className="text-white/30 text-sm md:text-base mt-8 italic">
        "O padrão crescente das dezenas revela onde estão os números mais decisivos"
      </p>
    </div>
  );
}
