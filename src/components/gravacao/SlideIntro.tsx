interface SlideIntroProps {
  concurso: number;
  data: string;
  premiacao: string;
}

export default function SlideIntro({ concurso, data, premiacao }: SlideIntroProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center w-full h-full">
      <p className="text-emerald-400 text-lg tracking-[0.3em] uppercase font-medium">
        Resultado
      </p>
      <h1 className="text-6xl md:text-8xl font-extrabold text-white tracking-tight">
        LOTOFÁCIL
      </h1>
      <div className="flex items-center gap-3 text-white/60 text-xl md:text-2xl">
        <span>Concurso</span>
        <span className="text-white font-bold">{concurso}</span>
      </div>
      <p className="text-white/50 text-base md:text-lg capitalize">{data}</p>
      <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-8 py-4">
        <p className="text-emerald-400 text-sm uppercase tracking-wider mb-1">
          Premiação Total
        </p>
        <p className="text-emerald-300 text-3xl md:text-5xl font-bold">
          {premiacao}
        </p>
      </div>
    </div>
  );
}
