import Mega30Header from "../Mega30Header";
import DezenaBolaMega from "../DezenaBolaMega";
import type { Mega30AnosData } from "@/hooks/useGravacaoMega30Anos";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface Props {
  data: Mega30AnosData;
}

export default function Slide01TopPorMes({ data }: Props) {
  return (
    <div className="w-full h-full flex flex-col" style={{ paddingTop: 130, paddingBottom: 40, paddingLeft: 48, paddingRight: 48 }}>
      <Mega30Header
        aula={1}
        estudoNome="Top 15 dezenas nos 30 anos"
        tipoAnalise="Top 15 por Mês (todos os anos somados)"
      />

      <div className="grid grid-cols-3 grid-rows-4 gap-3 flex-1 mt-4">
        {MESES.map((nome, i) => {
          const mes = i + 1;
          const top = data.topPorMes[mes] ?? [];
          return (
            <div
              key={mes}
              className="rounded-xl px-4 py-2.5 flex flex-col"
              style={{
                background: "linear-gradient(135deg, rgba(10,40,24,0.78), rgba(6,27,17,0.7))",
                border: "1px solid rgba(212,175,55,0.35)",
                boxShadow: "inset 0 1px 0 rgba(212,175,55,0.1), 0 4px 14px rgba(0,0,0,0.3)",
              }}
            >
              <p
                className="text-[13px] tracking-[0.2em] uppercase font-semibold mb-2"
                style={{ color: "#D4AF37", fontFamily: "'Cinzel', serif" }}
              >
                {nome}
              </p>
              <div className="grid grid-cols-8 gap-1.5 flex-1 content-start">
                {top.map((d) => (
                  <DezenaBolaMega key={d.dezena} numero={d.dezena} size="xs" />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
