import Mega30Header from "../Mega30Header";
import DezenaBolaMega from "../DezenaBolaMega";
import type { Mega30AnosData } from "@/hooks/useGravacaoMega30Anos";

interface Props {
  data: Mega30AnosData;
  /** página (0-indexed) */
  pagina: number;
  totalPaginas: number;
  anosNaPagina: number[];
}

export default function Slide02TopPorAno({ data, pagina, totalPaginas, anosNaPagina }: Props) {
  return (
    <div className="w-full h-full flex flex-col" style={{ paddingTop: 130, paddingBottom: 40, paddingLeft: 48, paddingRight: 48 }}>
      <Mega30Header
        aula={1}
        estudoNome="Top 15 dezenas nos 30 anos"
        tipoAnalise={`Top 15 por Ano (${pagina + 1}/${totalPaginas})`}
      />

      <div className="flex flex-col gap-2 flex-1 mt-4">
        {anosNaPagina.map((ano) => {
          const top = data.topPorAno[ano] ?? [];
          return (
            <div
              key={ano}
              className="rounded-xl px-5 py-2.5 flex items-center gap-5"
              style={{
                background: "linear-gradient(90deg, rgba(10,40,24,0.85), rgba(6,27,17,0.6))",
                border: "1px solid rgba(212,175,55,0.32)",
                boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
              }}
            >
              <div
                className="text-3xl font-extrabold min-w-[110px]"
                style={{
                  fontFamily: "'Cinzel', serif",
                  color: "#D4AF37",
                  textShadow: "0 0 12px rgba(212,175,55,0.25)",
                }}
              >
                {ano}
              </div>
              <div className="flex gap-2 flex-wrap flex-1 justify-end">
                {top.map((d) => (
                  <DezenaBolaMega key={d.dezena} numero={d.dezena} size="sm" />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
