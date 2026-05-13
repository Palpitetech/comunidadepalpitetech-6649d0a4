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
    const geral = topInicialGeral(concursos, 1)[0];
    const par = topInicialPares(concursos, 1)[0];
    const impar = topInicialImpares(concursos, 1)[0];
    return { geral, par, impar };
  }, [concursos]);

  return (
    <div className="w-full h-full flex flex-col pt-32 pb-6 px-6">
      <Mega30Header
        aula={7}
        estudoNome="Síntese — Dezenas de Início"
        tipoAnalise="As 3 melhores apostas para a menor dezena do volante"
      />

      <div className="flex flex-col items-center gap-8 max-w-[1280px] mx-auto w-full mt-2 flex-1 justify-center">
        <div className="grid grid-cols-3 gap-6 w-full">
          {[
            { label: "Geral", item: sintese.geral, cor: "#D4AF37" },
            { label: "Par", item: sintese.par, cor: "#43A047" },
            { label: "Ímpar", item: sintese.impar, cor: "#E53935" },
          ].map((c) => (
            <div
              key={c.label}
              className="rounded-xl px-6 py-6 text-center flex flex-col items-center gap-3"
              style={{
                background:
                  "linear-gradient(180deg, rgba(10,40,24,0.95) 0%, rgba(6,28,16,0.95) 100%)",
                border: `2px solid ${c.cor}`,
                boxShadow: `0 0 18px ${c.cor}55, 0 4px 14px rgba(0,0,0,0.45)`,
              }}
            >
              <p
                className="uppercase tracking-[0.3em] text-xs"
                style={{ color: "rgba(245,230,179,0.75)", fontFamily: "'Cinzel', serif" }}
              >
                Top inicial · {c.label}
              </p>
              <DezenaBolaMega numero={c.item.dezena} size="xl" />
              <p
                className="font-extrabold leading-none"
                style={{
                  color: "#F5E6B3",
                  fontFamily: "'Cinzel', serif",
                  fontSize: 24,
                }}
              >
                {c.item.freq}×
              </p>
              <p style={{ color: "rgba(245,230,179,0.8)" }}>
                {c.item.pct.toFixed(2)}% dos concursos
              </p>
            </div>
          ))}
        </div>

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
            Fixe a <strong style={{ color: "#F5E6B3" }}>{String(sintese.geral.dezena).padStart(2, "0")}</strong> como
            menor dezena do seu volante. Se quiser jogar par, prefira a{" "}
            <strong style={{ color: "#A5D6A7" }}>{String(sintese.par.dezena).padStart(2, "0")}</strong>.
            Se preferir ímpar, escolha a{" "}
            <strong style={{ color: "#EF9A9A" }}>{String(sintese.impar.dezena).padStart(2, "0")}</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
