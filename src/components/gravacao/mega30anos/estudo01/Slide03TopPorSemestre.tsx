import Mega30Header from "../Mega30Header";
import DezenaBolaMega from "../DezenaBolaMega";
import type { Mega30AnosData } from "@/hooks/useGravacaoMega30Anos";

interface Props {
  data: Mega30AnosData;
}

export default function Slide03TopPorSemestre({ data }: Props) {
  const blocos = [
    { titulo: "1º Semestre", subtitulo: "Janeiro a Junho · todos os anos", lista: data.topPorSemestre.primeiro },
    { titulo: "2º Semestre", subtitulo: "Julho a Dezembro · todos os anos", lista: data.topPorSemestre.segundo },
  ];

  return (
    <div className="w-full h-full flex flex-col" style={{ paddingTop: 130, paddingBottom: 40, paddingLeft: 48, paddingRight: 48 }}>
      <Mega30Header
        aula={1}
        estudoNome="Top 15 dezenas nos 30 anos"
        tipoAnalise="Top 15 por Semestre (todos os anos somados)"
      />

      <div className="grid grid-cols-2 gap-6 flex-1 mt-4">
        {blocos.map((b) => (
          <div
            key={b.titulo}
            className="rounded-2xl p-6 flex flex-col"
            style={{
              background: "linear-gradient(160deg, rgba(10,40,24,0.85), rgba(6,27,17,0.7))",
              border: "1.5px solid rgba(212,175,55,0.45)",
              boxShadow: "inset 0 1px 0 rgba(212,175,55,0.1), 0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            <p
              className="text-2xl tracking-[0.2em] uppercase font-bold"
              style={{ color: "#D4AF37", fontFamily: "'Cinzel', serif" }}
            >
              {b.titulo}
            </p>
            <p className="text-white/60 text-sm mb-5">{b.subtitulo}</p>

            <div className="grid grid-cols-5 gap-3 flex-1 content-center">
              {b.lista.map((d) => (
                <DezenaBolaMega key={d.dezena} numero={d.dezena} size="md" freq={d.freq} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
