import { formatarDezena, DEZENAS_POR_SORTEIO } from "@/lib/megasena";
import type { EstatisticaItem, TendenciaIndicador, TendenciaFaixa } from "@/hooks/useGravacaoData";

interface SlideEstatisticasMegasenaProps {
  dezenas: number[];
  estatisticas: EstatisticaItem[];
  tendencias: TendenciaIndicador[];
}

const LABEL_TO_TENDENCIA: Record<string, string> = {
  Pares: "Pares/Ímpares",
  Ímpares: "Pares/Ímpares",
  Primos: "Primos",
  Moldura: "Moldura/Miolo",
  Repetidas: "Repetidas/Novas",
  Soma: "",
};

const USES_COMPLEMENTAR = new Set(["Ímpares"]);

function getPadraoSet(tendencia: TendenciaIndicador | undefined): Set<number> {
  if (!tendencia) return new Set();
  const sorted = [...tendencia.faixas].sort((a, b) => b.ocorrencias - a.ocorrencias);
  return new Set(sorted.slice(0, 3).map((f) => f.valor));
}

function filtrarFaixas(faixas: TendenciaFaixa[]): TendenciaFaixa[] {
  const sorted = [...faixas].sort((a, b) => b.ocorrencias - a.ocorrencias);
  const top3 = sorted.slice(0, 3);
  const top3Vals = new Set(top3.map((f) => f.valor));
  const extra = sorted.find((f) => !top3Vals.has(f.valor) && f.atraso >= f.media);
  const result = [...top3];
  if (extra) result.push(extra);
  return result.sort((a, b) => b.ocorrencias - a.ocorrencias);
}

export default function SlideEstatisticasMegasena({ dezenas, estatisticas, tendencias }: SlideEstatisticasMegasenaProps) {
  const sorteadas = new Set(dezenas);

  const padraoMap = new Map<string, Set<number>>();
  for (const t of tendencias) {
    padraoMap.set(t.label, getPadraoSet(t));
  }

  function isDentroPadrao(label: string, valor: number): boolean {
    const tendLabel = LABEL_TO_TENDENCIA[label];
    if (!tendLabel) return true;
    const padrao = padraoMap.get(tendLabel);
    if (!padrao) return true;
    if (USES_COMPLEMENTAR.has(label)) {
      return padrao.has(DEZENAS_POR_SORTEIO - valor);
    }
    return padrao.has(valor);
  }

  return (
    <div className="flex w-full h-full gap-6">
      {/* Left 30%: resultado grid + indicadores */}
      <div className="w-[30%] flex flex-col items-center justify-center gap-4">
        <div>
          <p className="text-emerald-300/60 text-sm mb-2 tracking-wide text-center">Resultado</p>
          <div className="grid grid-cols-10 gap-[2px]">
            {Array.from({ length: 60 }, (_, i) => i + 1).map((num) => (
              <div
                key={num}
                className={`
                  w-6 h-6 rounded flex items-center justify-center
                  text-[8px] font-bold
                  ${sorteadas.has(num) ? "text-white" : "bg-white/5 text-white/15"}
                `}
                style={
                  sorteadas.has(num)
                    ? { background: "linear-gradient(135deg, #10B981, #059669)" }
                    : undefined
                }
              >
                {formatarDezena(num)}
              </div>
            ))}
          </div>
        </div>

        <div className="w-full space-y-1.5">
          <p className="text-emerald-300/60 text-xs tracking-wide text-center mb-2">Indicadores</p>
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
        <p className="text-emerald-300/70 text-sm mb-4 tracking-wide">
          📊 Tendências — Próximo Concurso
        </p>
        <div className="space-y-5">
          {tendencias.map((indicador) => {
            const faixas = filtrarFaixas(indicador.faixas);
            const padrao = padraoMap.get(indicador.label) ?? new Set();
            const totalOcorr = indicador.faixas.reduce((s, f) => s + f.ocorrencias, 0);
            return (
              <div key={indicador.label}>
                <p className="text-emerald-300 text-xs font-semibold mb-2 flex items-center gap-1.5">
                  <span>{indicador.emoji}</span>
                  {indicador.label}
                </p>
                <div className="space-y-1">
                  {faixas.map((faixa) => {
                    const isPadrao = padrao.has(faixa.valor);
                    const isProonto = faixa.atraso >= faixa.media;
                    const pct = totalOcorr > 0 ? ((faixa.ocorrencias / totalOcorr) * 100).toFixed(1) : "0.0";
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
                        <span className="text-white/50 text-sm min-w-[55px]">
                          1 em {faixa.media}
                        </span>
                        <span className={`text-sm min-w-[55px] ${isProonto ? "text-emerald-400 font-semibold" : "text-white/40"}`}>
                          atraso {faixa.atraso}
                        </span>
                        <span className="text-white/40 text-sm min-w-[40px]">
                          {pct}%
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
