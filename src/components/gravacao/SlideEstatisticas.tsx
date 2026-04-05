import { formatarDezena } from "@/lib/lotofacil";
import type { EstatisticaItem, TendenciaIndicador, TendenciaFaixa } from "@/hooks/useGravacaoData";

interface SlideEstatisticasProps {
  dezenas: number[];
  estatisticas: EstatisticaItem[];
  tendencias: TendenciaIndicador[];
}

// Map estatistica label → tendencia label for cross-referencing
const LABEL_TO_TENDENCIA: Record<string, string> = {
  Pares: "Pares/Ímpares",
  Ímpares: "Pares/Ímpares",
  Primos: "Primos",
  Moldura: "Moldura/Miolo",
  Repetidas: "Repetidas/Novas",
  Soma: "", // no tendência for soma
};

// For Ímpares, the value to check is complementar (15 - pares)
const USES_COMPLEMENTAR = new Set(["Ímpares"]);

/** Get top 3 values (padrão) for a tendência indicator */
function getPadraoSet(tendencia: TendenciaIndicador | undefined): Set<number> {
  if (!tendencia) return new Set();
  const sorted = [...tendencia.faixas].sort((a, b) => b.ocorrencias - a.ocorrencias);
  return new Set(sorted.slice(0, 3).map((f) => f.valor));
}

/** Top 3 ocorrências + até 1 extra com atraso >= média = 3–4 itens */
function filtrarFaixas(faixas: TendenciaFaixa[]): TendenciaFaixa[] {
  const sorted = [...faixas].sort((a, b) => b.ocorrencias - a.ocorrencias);
  const top3 = sorted.slice(0, 3);
  const top3Vals = new Set(top3.map((f) => f.valor));
  const extra = sorted.find((f) => !top3Vals.has(f.valor) && f.atraso >= f.media);
  const result = [...top3];
  if (extra) result.push(extra);
  return result.sort((a, b) => b.ocorrencias - a.ocorrencias);
}

export default function SlideEstatisticas({ dezenas, estatisticas, tendencias }: SlideEstatisticasProps) {
  const sorteadas = new Set(dezenas);

  // Pre-compute padrão sets for each tendência
  const padraoMap = new Map<string, Set<number>>();
  for (const t of tendencias) {
    padraoMap.set(t.label, getPadraoSet(t));
  }

  // Check if an estatistica value is within padrão
  function isDentroPadrao(label: string, valor: number): boolean {
    const tendLabel = LABEL_TO_TENDENCIA[label];
    if (!tendLabel) return true; // Soma has no tendência, default green
    const padrao = padraoMap.get(tendLabel);
    if (!padrao) return true;
    if (USES_COMPLEMENTAR.has(label)) {
      // For Ímpares, check if corresponding pares value (15 - valor) is in padrão
      return padrao.has(15 - valor);
    }
    return padrao.has(valor);
  }

  return (
    <div className="flex w-full h-full gap-6">
      {/* Left 30%: resultado + indicadores */}
      <div className="w-[30%] flex flex-col items-center justify-center gap-6">
        <div>
          <p className="text-white/50 text-sm mb-3 tracking-wide text-center">Resultado</p>
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: 25 }, (_, i) => i + 1).map((num) => (
              <div
                key={num}
                className={`
                  w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center
                  text-xs md:text-sm font-bold
                  ${sorteadas.has(num) ? "bg-emerald-500 text-white" : "bg-white/5 text-white/15"}
                `}
              >
                {formatarDezena(num)}
              </div>
            ))}
          </div>
        </div>

        <div className="w-full space-y-1.5">
          <p className="text-white/50 text-xs tracking-wide text-center mb-2">Indicadores</p>
          {estatisticas.map((item) => {
            const dentro = isDentroPadrao(item.label, item.valor);
            return (
              <div
                key={item.label}
                className={`flex items-center justify-between rounded-lg px-3 py-1.5 ${
                  dentro ? "bg-emerald-500/15" : "bg-red-500/15"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${dentro ? "bg-emerald-400" : "bg-red-400"}`} />
                  <span className="text-white text-xs font-medium">{item.label}</span>
                </div>
                <span className={`text-sm font-bold ${dentro ? "text-emerald-400" : "text-red-400"}`}>
                  {item.valor}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right 70%: Tendências filtradas */}
      <div className="w-[70%] flex flex-col justify-center overflow-hidden">
        <p className="text-white/50 text-sm mb-4 tracking-wide">
          📊 Tendências — Próximo Concurso
        </p>
        <div className="space-y-5">
          {tendencias.map((indicador) => {
            const faixas = filtrarFaixas(indicador.faixas);
            const padrao = padraoMap.get(indicador.label) ?? new Set();
            return (
              <div key={indicador.label}>
                <p className="text-white/70 text-xs font-semibold mb-2 flex items-center gap-1.5">
                  <span>{indicador.emoji}</span>
                  {indicador.label}
                </p>
                <div className="space-y-1">
                  {faixas.map((faixa) => {
                    const isPadrao = padrao.has(faixa.valor);
                    const isProonto = faixa.atraso >= faixa.media;
                    return (
                      <div
                        key={faixa.valor}
                        className={`
                          flex items-center gap-4 rounded-lg px-4 py-2
                          ${isPadrao
                            ? "bg-emerald-500/15 border border-emerald-500/30"
                            : "bg-red-500/15 border border-red-500/30"
                          }
                        `}
                      >
                        <span className={`font-bold text-base min-w-[28px] ${isPadrao ? "text-emerald-400" : "text-red-400"}`}>
                          {faixa.valor}
                        </span>

                        <span className="text-white/50 text-sm min-w-[50px]">
                          ({faixa.ocorrencias}×)
                        </span>

                        <span className={`text-sm min-w-[60px] ${isProonto ? "text-emerald-400 font-semibold" : "text-white/40"}`}>
                          atraso {faixa.atraso}
                        </span>

                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ml-auto ${
                          isPadrao
                            ? "bg-emerald-500/25 text-emerald-300"
                            : "bg-red-500/25 text-red-300"
                        }`}>
                          {isPadrao ? "✅ Padrão" : "⚠️ Fora"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
