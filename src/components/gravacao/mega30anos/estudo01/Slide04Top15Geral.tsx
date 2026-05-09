import Mega30Header from "../Mega30Header";
import DezenaBolaMega from "../DezenaBolaMega";
import type { Mega30AnosData } from "@/hooks/useGravacaoMega30Anos";

interface Props {
  data: Mega30AnosData;
}

export default function Slide04Top15Geral({ data }: Props) {
  const top = data.top15Geral;
  return (
    <div className="w-full h-full flex flex-col" style={{ paddingTop: 130, paddingBottom: 40, paddingLeft: 48, paddingRight: 48 }}>
      <Mega30Header
        aula={1}
        estudoNome="Top 15 dezenas nos 30 anos"
        tipoAnalise="Ranking Final · 30 anos somados"
      />

      <div className="flex-1 flex flex-col items-center justify-center gap-6 mt-4">
        <div className="text-center">
          <p
            className="text-5xl md:text-6xl font-black tracking-tight"
            style={{
              fontFamily: "'Cinzel', serif",
              background: "linear-gradient(135deg, #F5EFE0, #D4AF37 50%, #B8860B)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 0 30px rgba(212,175,55,0.2)",
            }}
          >
            TOP 15 DEZENAS
          </p>
          <p className="text-white/70 text-base md:text-lg mt-2">
            {data.totalConcursos.toLocaleString("pt-BR")} concursos · de {data.primeiroConcurso.numero} ao {data.ultimoConcurso.numero}
          </p>
        </div>

        <div
          className="rounded-3xl px-10 py-8"
          style={{
            background: "linear-gradient(160deg, rgba(10,40,24,0.92), rgba(6,27,17,0.85))",
            border: "2px solid rgba(212,175,55,0.55)",
            boxShadow: "inset 0 1px 0 rgba(212,175,55,0.15), 0 12px 40px rgba(0,0,0,0.5), 0 0 60px rgba(212,175,55,0.08)",
          }}
        >
          <div className="grid grid-cols-8 gap-x-5 gap-y-4">
            {top.slice(0, 8).map((d) => (
              <DezenaBolaMega key={d.dezena} numero={d.dezena} size="lg" freq={d.freq} />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-x-5 gap-y-4 mt-5 px-7">
            {top.slice(8, 15).map((d) => (
              <DezenaBolaMega key={d.dezena} numero={d.dezena} size="lg" freq={d.freq} />
            ))}
          </div>
        </div>

        <p
          className="text-sm tracking-[0.3em] uppercase mt-2"
          style={{ color: "#D4AF37", fontFamily: "'Cinzel', serif" }}
        >
          Maratona Mega Especial · 30 anos de história
        </p>
      </div>
    </div>
  );
}
