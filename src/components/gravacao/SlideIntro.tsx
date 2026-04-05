interface SlideIntroProps {
  concurso: number;
  data: string;
  premiacao: string;
}

export default function SlideIntro({ concurso, data, premiacao }: SlideIntroProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 text-center w-full h-full">
      <p className="text-emerald-400 text-lg tracking-[0.3em] uppercase font-medium">
        Resultado
      </p>
      <h1 className="text-7xl md:text-9xl font-extrabold text-white tracking-tight leading-none">
        LOTOFÁCIL
      </h1>
      <div className="flex items-center gap-3">
        <span className="text-white/60 text-2xl md:text-3xl">Concurso</span>
        <span className="text-white font-bold text-4xl md:text-5xl">{concurso}</span>
      </div>
      <p className="text-white/50 text-base md:text-lg capitalize">{data}</p>
      <div className="mt-2 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-10 py-5">
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
