interface Mega30HeaderProps {
  aula: number;
  totalAulas?: number;
  estudoNome: string;
  tipoAnalise: string;
}

export default function Mega30Header({
  aula,
  totalAulas = 15,
  estudoNome,
  tipoAnalise,
}: Mega30HeaderProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-30 pt-6 px-12">
      <div
        className="mx-auto max-w-5xl rounded-xl px-8 py-3 text-center"
        style={{
          background: "linear-gradient(135deg, rgba(10,40,24,0.85), rgba(10,40,24,0.7))",
          border: "1px solid rgba(212,175,55,0.45)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
        }}
      >
        <p
          className="text-[11px] md:text-sm tracking-[0.35em] uppercase font-semibold"
          style={{ color: "#D4AF37", fontFamily: "'Cinzel', serif" }}
        >
          Aula {String(aula).padStart(2, "0")} de {totalAulas} — Maratona Mega Especial 30 anos
        </p>
        <p className="text-white/85 text-base md:text-lg mt-1 font-medium">
          Análise · <span style={{ color: "#F5EFE0" }}>{estudoNome}</span>
          <span className="text-[#D4AF37]/70 mx-2">·</span>
          <span className="text-white/70">{tipoAnalise}</span>
        </p>
      </div>
    </div>
  );
}
