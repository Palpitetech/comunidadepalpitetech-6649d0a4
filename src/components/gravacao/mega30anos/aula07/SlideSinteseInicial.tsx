import { useMemo } from "react";
import type { ConcursoMega } from "@/lib/megaEspecialEngine";
import {
  topInicialGeral,
  topInicialPares,
  topInicialImpares,
} from "./aula07Helpers";
import DezenaBolaMega from "../DezenaBolaMega";
import Mega30Header from "../Mega30Header";

interface Props {
  concursos: ConcursoMega[];
}

export default function SlideSinteseInicial({ concursos }: Props) {
  const sintese = useMemo(() => {
    const geral = topInicialGeral(concursos, 3);
    const par = topInicialPares(concursos, 3);
    const impar = topInicialImpares(concursos, 3);
    return { geral, par, impar };
  }, [concursos]);

  return (
    <div className="w-full h-full flex flex-col pt-32 pb-6 px-6">
      <Mega30Header
        aula={7}
        estudoNome="Síntese — Dezenas de Início"
        tipoAnalise="Top 3 de cada categoria para a menor dezena do volante"
      />

      <div className="flex flex-col items-center gap-8 max-w-[1280px] mx-auto w-full mt-2 flex-1 justify-center">
        {[
          { label: "Geral", itens: sintese.geral, cor: "#D4AF37" },
          { label: "Par", itens: sintese.par, cor: "#43A047" },
          { label: "Ímpar", itens: sintese.impar, cor: "#E53935" },
        ].map((cat) => (
          <div
            key={cat.label}
            className="rounded-xl px-6 py-4 w-full flex items-center gap-5"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,40,24,0.95) 0%, rgba(6,28,16,0.95) 100%)",
              border: `2px solid ${cat.cor}`,
              boxShadow: `0 0 18px ${cat.cor}55, 0 4px 14px rgba(0,0,0,0.45)`,
            }}
          >
            <div className="shrink-0 w-28 text-center">
              <p
                className="uppercase tracking-[0.3em] text-xs mb-1"
                style={{ color: "rgba(245,230,179,0.75)", fontFamily: "'Cinzel', serif" }}
              >
                Top 3
              </p>
              <p
                className="font-extrabold"
                style={{
                  color: cat.cor,
                  fontFamily: "'Cinzel', serif",
                  fontSize: 20,
                  textShadow: `0 0 10px ${cat.cor}66`,
                }}
              >
                {cat.label}
              </p>
            </div>

            <div className="flex items-center gap-6 flex-1">
              {cat.itens.map((it, idx) => (
                <div key={it.dezena} className="flex items-center gap-3">
                  <div
                    className="shrink-0 w-7 text-center font-extrabold"
                    style={{
                      color: idx === 0 ? cat.cor : "rgba(245,230,179,0.7)",
                      fontFamily: "'Cinzel', serif",
                      fontSize: 18,
                      textShadow: "0 1px 3px rgba(0,0,0,0.6)",
                    }}
                  >
                    {idx + 1}º
                  </div>
                  <DezenaBolaMega numero={it.dezena} size="md" />
                  <div className="flex flex-col">
                    <span
                      className="font-extrabold tabular-nums"
                      style={{ color: "#F5E6B3", fontFamily: "'Cinzel', serif", fontSize: 18 }}
                    >
                      {it.freq}×
                    </span>
                    <span className="text-xs" style={{ color: "rgba(245,230,179,0.6)" }}>
                      {it.pct.toFixed(2)}%
                    </span>
                  </div>
                  {idx < 2 && (
                    <div
                      className="h-10 w-px"
                      style={{ background: "rgba(212,175,55,0.2)" }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div
          className="rounded-2xl px-8 py-5 text-center max-w-3xl"
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "2px solid rgba(212,175,55,0.6)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
          }}
        >
          <p
            className="uppercase tracking-[0.35em] text-xs mb-2"
            style={{ color: "#D4AF37", fontFamily: "'Cinzel', serif" }}
          >
            Estratégia
          </p>
          <p className="text-white/85 text-base md:text-lg leading-relaxed">
            Fixe a{" "}
            <strong style={{ color: "#F5E6B3" }}>
              {String(sintese.geral[0].dezena).padStart(2, "0")}
            </strong>{" "}
            como menor dezena do seu volante. Se quiser jogar par, prefira a{" "}
            <strong style={{ color: "#A5D6A7" }}>
              {String(sintese.par[0].dezena).padStart(2, "0")}
            </strong>
            . Se preferir ímpar, escolha a{" "}
            <strong style={{ color: "#EF9A9A" }}>
              {String(sintese.impar[0].dezena).padStart(2, "0")}
            </strong>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
