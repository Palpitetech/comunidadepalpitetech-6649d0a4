interface Props {
  aula: number;
  titulo: string;
  subtitulo?: string;
}

export default function Mega30CapaProvisoria({ aula, titulo, subtitulo }: Props) {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center text-center px-10"
      style={{
        background:
          "radial-gradient(ellipse at center, #0d3a22 0%, #061b11 70%, #000 100%)",
      }}
    >
      <p
        className="uppercase tracking-[0.5em] text-sm mb-6"
        style={{ color: "rgba(212,175,55,0.6)", fontFamily: "'Cinzel', serif" }}
      >
        Capa provisória
      </p>
      <p
        className="uppercase tracking-[0.4em] text-base mb-3"
        style={{ color: "#D4AF37", fontFamily: "'Cinzel', serif" }}
      >
        Aula {String(aula).padStart(2, "0")} · Maratona Mega 30 anos
      </p>
      <h1
        className="font-extrabold leading-tight max-w-4xl"
        style={{
          color: "#F5E6B3",
          fontFamily: "'Cinzel', serif",
          fontSize: "clamp(36px, 7vw, 80px)",
          textShadow: "0 4px 16px rgba(0,0,0,0.8)",
        }}
      >
        {titulo}
      </h1>
      {subtitulo && (
        <p
          className="mt-6 text-lg sm:text-xl"
          style={{ color: "rgba(245,230,179,0.75)" }}
        >
          {subtitulo}
        </p>
      )}
    </div>
  );
}
