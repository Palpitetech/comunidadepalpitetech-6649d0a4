import { useMemo } from "react";
import { calcularEstudo, type ConcursoMega } from "@/lib/megaEspecialEngine";
import {
  freqInicioPorColuna,
  freqFimPorColuna,
  freqGeralPorColuna,
  topDezenaInicialPorColuna,
  topDezenaFinalPorColuna,
  dezenasDaColuna,
} from "./aula06Helpers";
import DezenaBolaMega from "../DezenaBolaMega";
import Mega30Header from "../Mega30Header";

interface Props {
  concursos: ConcursoMega[];
}

export default function SlideSinteseColunas({ concursos }: Props) {
  const sintese = useMemo(() => {
    const inicio = freqInicioPorColuna(concursos);
    const fim = freqFimPorColuna(concursos);
    const geral = freqGeralPorColuna(concursos);

    const topInicio = [...inicio].sort((a, b) => b.freq - a.freq)[0];
    const topFim = [...fim].sort((a, b) => b.freq - a.freq)[0];
    const topGeral = [...geral].sort((a, b) => b.freq - a.freq)[0];

    const topDezInicial = topDezenaInicialPorColuna(concursos).find(
      (d) => d.coluna === topInicio.coluna,
    );
    const topDezFinal = topDezenaFinalPorColuna(concursos).find(
      (d) => d.coluna === topFim.coluna,
    );

    const ranking = calcularEstudo(concursos, {
      estudoId: "aula06-sintese-reforco",
      agrupamento: "dezena",
      periodo: { tipo: "total" },
      topN: 10,
      restringirA: dezenasDaColuna(topGeral.coluna),
    });

    const escolhidas = new Set<number>();
    const jogo: { dezena: number; freq: number; papel: string }[] = [];

    if (topDezInicial?.dezena != null) {
      escolhidas.add(topDezInicial.dezena);
      jogo.push({ dezena: topDezInicial.dezena, freq: topDezInicial.freq, papel: "Início" });
    }
    if (topDezFinal?.dezena != null && !escolhidas.has(topDezFinal.dezena)) {
      escolhidas.add(topDezFinal.dezena);
      jogo.push({ dezena: topDezFinal.dezena, freq: topDezFinal.freq, papel: "Final" });
    }
    for (const r of ranking.ranking) {
      if (jogo.length >= 6) break;
      const n = Number(r.chave);
      if (escolhidas.has(n)) continue;
      escolhidas.add(n);
      jogo.push({ dezena: n, freq: r.freq, papel: "Reforço" });
    }
    jogo.sort((a, b) => a.dezena - b.dezena);

    return { topInicio, topFim, topGeral, jogo };
  }, [concursos]);

  return (
    <div className="w-full h-full flex flex-col pt-36 pb-6 px-4">
      <Mega30Header
        aula={6}
        estudoNome="Síntese — Colunas Quentes"
        tipoAnalise="Estratégia para o palpite + jogo-exemplo de 6 dezenas"
      />

      <div className="flex flex-col items-center gap-6 max-w-[1280px] mx-auto w-full mt-2 flex-1 justify-center">
        <div className="grid grid-cols-3 gap-5 w-full">
          {[
            { label: "Comece em", coluna: sintese.topInicio.coluna, valor: sintese.topInicio.freq, pct: sintese.topInicio.pct, cor: "#E53935" },
            { label: "Termine em", coluna: sintese.topFim.coluna, valor: sintese.topFim.freq, pct: sintese.topFim.pct, cor: "#1E88E5" },
            { label: "Reforce", coluna: sintese.topGeral.coluna, valor: sintese.topGeral.freq, pct: sintese.topGeral.pct, cor: "#43A047" },
          ].map((c) => (
            <div
              key={c.label}
              className="rounded-xl px-6 py-5 text-center"
              style={{
                background:
                  "linear-gradient(180deg, rgba(10,40,24,0.95) 0%, rgba(6,28,16,0.95) 100%)",
                border: `2px solid ${c.cor}`,
                boxShadow: `0 0 18px ${c.cor}55, 0 4px 14px rgba(0,0,0,0.45)`,
              }}
            >
              <p
                className="uppercase tracking-[0.3em] text-xs mb-2"
                style={{ color: "rgba(245,230,179,0.7)", fontFamily: "'Cinzel', serif" }}
              >
                {c.label}
              </p>
              <p
                className="font-extrabold leading-none"
                style={{
                  color: "#F5E6B3",
                  fontFamily: "'Cinzel', serif",
                  fontSize: 64,
                  textShadow: `0 0 18px ${c.cor}88`,
                }}
              >
                C{c.coluna}
              </p>
              <p className="mt-2 text-sm" style={{ color: "rgba(245,230,179,0.8)" }}>
                {c.valor}× &nbsp;·&nbsp; {c.pct.toFixed(1)}%
              </p>
            </div>
          ))}
        </div>

        <div
          className="rounded-2xl px-8 py-5"
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "2px solid rgba(212,175,55,0.6)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
          }}
        >
          <p
            className="text-center uppercase tracking-[0.35em] text-xs mb-3"
            style={{ color: "#D4AF37", fontFamily: "'Cinzel', serif" }}
          >
            Jogo-exemplo · 6 dezenas
          </p>
          <div className="flex items-center gap-4">
            {sintese.jogo.map((it) => (
              <DezenaBolaMega key={it.dezena} numero={it.dezena} size="lg" freq={it.freq} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
