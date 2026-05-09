import { useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";
import { calcularEstudo, type ConcursoMega } from "@/lib/megaEspecialEngine";
import { TODAS_IMPARES } from "./aula03Helpers";
import DezenaBolaMega from "../DezenaBolaMega";

interface Props {
  concursos: ConcursoMega[];
}

const TITULO = "Top 15 dezenas ÍMPARES para Mega Especial 30 anos / R$ 150 milhões";

export default function SlideTop15ImparesFinal({ concursos }: Props) {
  const top15 = useMemo(
    () =>
      calcularEstudo(concursos, {
        estudoId: "aula03-top15-impares",
        agrupamento: "dezena",
        periodo: { tipo: "total" },
        topN: 15,
        restringirA: TODAS_IMPARES,
      }),
    [concursos],
  );
  const [copiado, setCopiado] = useState(false);

  const copiarTitulo = async () => {
    await navigator.clipboard.writeText(TITULO);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-6 sm:px-12 py-10">
      <div className="text-center mb-2">
        <p
          className="uppercase tracking-[0.4em] text-xs sm:text-sm mb-3"
          style={{ color: "rgba(212,175,55,0.7)", fontFamily: "'Cinzel', serif" }}
        >
          Resultado Final · Aula 03
        </p>
        <h1
          className="font-extrabold leading-tight max-w-4xl"
          style={{
            color: "#F5E6B3",
            fontFamily: "'Cinzel', serif",
            fontSize: "clamp(24px, 4.5vw, 44px)",
            textShadow: "0 2px 6px rgba(0,0,0,0.7)",
          }}
        >
          Top 15 dezenas ÍMPARES para
          <br />
          <span style={{ color: "#D4AF37" }}>Mega Especial 30 anos</span>
          <br />
          <span style={{ color: "#FFFFFF" }}>R$ 150 milhões</span>
        </h1>
      </div>

      <button
        onClick={copiarTitulo}
        className="flex items-center gap-2 px-5 py-2.5 mt-4 mb-6 rounded-full font-bold text-sm transition active:scale-95"
        style={{ background: "#D4AF37", color: "#0A2818", minHeight: 44 }}
      >
        {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copiado ? "Título copiado!" : "Copiar título"}
      </button>

      <div
        className="grid grid-cols-5 gap-3 sm:gap-4 p-5 rounded-2xl"
        style={{
          background: "rgba(0,0,0,0.35)",
          border: "2px solid rgba(212,175,55,0.6)",
          boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
        }}
      >
        {top15.ranking.map((it) => (
          <DezenaBolaMega key={it.chave} numero={it.chave} size="lg" freq={it.freq} />
        ))}
      </div>

      <p
        className="text-center mt-5 text-sm sm:text-base"
        style={{ color: "rgba(245,230,179,0.7)" }}
      >
        Análise técnica baseada em {top15.meta.totalConcursos} concursos da Mega-Sena.
      </p>
    </div>
  );
}
