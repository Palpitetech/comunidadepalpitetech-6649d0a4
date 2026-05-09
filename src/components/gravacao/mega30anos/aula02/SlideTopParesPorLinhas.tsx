import { useMemo } from "react";
import { calcularEstudo, type ConcursoMega } from "@/lib/megaEspecialEngine";
import { PARES_LINHA } from "./aula02Helpers";
import DezenaBolaMega from "../DezenaBolaMega";
import Mega30Header from "../Mega30Header";

interface Props {
  concursos: ConcursoMega[];
}

const TOP_DESTAQUE = 3;

interface ItemDezena {
  dezena: number;
  freq: number;
}

/** Cor do "pódio" — ouro / prata / bronze. */
const POSITION_STYLE: Record<number, { color: string; shadow: string; label: string }> = {
  0: { color: "#F4C744", shadow: "rgba(244,199,68,0.55)", label: "1º" },
  1: { color: "#D8D8D8", shadow: "rgba(216,216,216,0.45)", label: "2º" },
  2: { color: "#CD8B4A", shadow: "rgba(205,139,74,0.55)", label: "3º" },
};

function RankBadge({ posicao }: { posicao: number }) {
  const s = POSITION_STYLE[posicao];
  return (
    <div
      className="absolute -top-1.5 -left-1.5 z-10 rounded-full flex items-center justify-center font-extrabold"
      style={{
        width: 20,
        height: 20,
        background: s.color,
        color: "#0A2818",
        border: "1.5px solid rgba(0,0,0,0.4)",
        boxShadow: `0 0 8px ${s.shadow}`,
        fontFamily: "'Cinzel', serif",
        fontSize: 10,
        lineHeight: 1,
      }}
    >
      {posicao + 1}
    </div>
  );
}

function LinhaRow({ linha, itens }: { linha: number; itens: ItemDezena[] }) {
  const top = itens.slice(0, TOP_DESTAQUE);
  const resto = itens.slice(TOP_DESTAQUE);

  return (
    <div
      className="flex items-stretch gap-3 rounded-xl pl-3 pr-4 py-2 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, rgba(10,40,24,0.95) 0%, rgba(6,28,16,0.95) 100%)",
        border: "2px solid rgba(212,175,55,0.7)",
        boxShadow: "0 3px 12px rgba(0,0,0,0.45)",
      }}
    >
      {/* faixa lateral dourada */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{
          background: "linear-gradient(180deg, #D4AF37 0%, #8B6914 100%)",
        }}
      />

      {/* Label da linha */}
      <div
        className="flex flex-col items-center justify-center shrink-0 w-16"
        style={{
          color: "#F5E6B3",
          fontFamily: "'Cinzel', serif",
          textShadow: "0 1px 3px rgba(0,0,0,0.6)",
        }}
      >
        <span className="text-[9px] uppercase tracking-[0.2em] opacity-70">Linha</span>
        <span className="font-black leading-none" style={{ fontSize: 34 }}>
          {linha}
        </span>
      </div>

      {/* Bloco TOP 3 — destaque com fundo sutil */}
      <div
        className="flex items-center gap-3 px-3 rounded-lg"
        style={{
          background:
            "linear-gradient(135deg, rgba(229,57,53,0.18) 0%, rgba(229,57,53,0.06) 100%)",
          border: "1px solid rgba(229,57,53,0.45)",
        }}
      >
        {top.map((it, idx) => (
          <div key={it.dezena} className="relative">
            <RankBadge posicao={idx} />
            <div
              className="rounded-md p-0.5"
              style={{
                border: "2px solid #E53935",
                boxShadow: "0 0 10px rgba(229,57,53,0.55)",
              }}
            >
              <DezenaBolaMega numero={it.dezena} size="md" freq={it.freq} />
            </div>
          </div>
        ))}
      </div>

      {/* Separador vertical */}
      <div
        className="self-stretch my-1"
        style={{
          width: 1,
          background:
            "linear-gradient(180deg, transparent 0%, rgba(212,175,55,0.4) 50%, transparent 100%)",
        }}
      />

      {/* Demais pares — menores e mais discretos */}
      <div className="flex items-center gap-2 flex-1 justify-around opacity-80">
        {resto.map((it) => (
          <DezenaBolaMega key={it.dezena} numero={it.dezena} size="sm" freq={it.freq} />
        ))}
      </div>
    </div>
  );
}

export default function SlideTopParesPorLinhas({ concursos }: Props) {
  const dados = useMemo(() => {
    return Object.entries(PARES_LINHA).map(([linha, dezenas]) => {
      const r = calcularEstudo(concursos, {
        estudoId: `aula02-linha-${linha}`,
        agrupamento: "dezena",
        periodo: { tipo: "total" },
        topN: dezenas.length,
        restringirA: dezenas,
      });
      return {
        linha: Number(linha),
        itens: r.ranking.map((i) => ({ dezena: i.chave, freq: i.freq })),
      };
    });
  }, [concursos]);

  return (
    <div className="w-full h-full flex flex-col pt-24 pb-4 px-4">
      <Mega30Header
        aula={2}
        estudoNome="Top dezenas PARES por LINHA"
        tipoAnalise="Top 3 pares destacados — pódio 1º · 2º · 3º em cada linha"
      />
      <div className="flex flex-col gap-2 max-w-[1180px] mx-auto w-full mt-2 flex-1 justify-center">
        {dados.map((d) => (
          <LinhaRow key={d.linha} linha={d.linha} itens={d.itens} />
        ))}
      </div>
    </div>
  );
}
