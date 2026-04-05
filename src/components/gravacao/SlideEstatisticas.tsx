import { formatarDezena } from "@/lib/lotofacil";
import type { EstatisticaItem, TendenciaIndicador, TendenciaFaixa } from "@/hooks/useGravacaoData";

interface SlideEstatisticasProps {
  dezenas: number[];
  estatisticas: EstatisticaItem[];
  tendencias: TendenciaIndicador[];
}

const STATUS_COLORS = {
  dentro: { bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
  limite: { bg: "bg-yellow-500/15", text: "text-yellow-400", dot: "bg-yellow-400" },
  fora: { bg: "bg-red-500/15", text: "text-red-400", dot: "bg-red-400" },
};

/** Top 3 ocorrências + até 1 extra com atraso >= média = 3–4 itens */
function filtrarFaixas(faixas: TendenciaFaixa[]): TendenciaFaixa[] {
  const sorted = [...faixas].sort((a, b) => b.ocorrencias - a.ocorrencias);
  const top3 = sorted.slice(0, 3);
  const top3Vals = new Set(top3.map((f) => f.valor));

  // Procurar 1 faixa extra com destaque que não esteja no top 3
  const extra = sorted.find((f) => !top3Vals.has(f.valor) && f.atraso >= f.media);

  const result = [...top3];
  if (extra) result.push(extra);
  return result.sort((a, b) => b.ocorrencias - a.ocorrencias);
}

export default function SlideEstatisticas({ dezenas, estatisticas, tendencias }: SlideEstatisticasProps) {
  const sorteadas = new Set(dezenas);

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
            const colors = STATUS_COLORS[item.status];
            return (
              <div
                key={item.label}
                className={`flex items-center justify-between rounded-lg px-3 py-1.5 ${colors.bg}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                  <span className="text-white text-xs font-medium">{item.label}</span>
                </div>
                <span className={`text-sm font-bold ${colors.text}`}>{item.valor}</span>
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
            return (
              <div key={indicador.label}>
                <p className="text-white/70 text-xs font-semibold mb-2 flex items-center gap-1.5">
                  <span>{indicador.emoji}</span>
                  {indicador.label}
                </p>
                <div className="space-y-1">
                  {faixas.map((faixa) => {
                    const isProonto = faixa.atraso >= faixa.media;
                    return (
                      <div
                        key={faixa.valor}
                        className={`
                          flex items-center gap-4 rounded-lg px-4 py-2
                          ${isProonto
                            ? "bg-emerald-500/15 border border-emerald-500/30"
                            : "bg-white/[0.04]"
                          }
                        `}
                      >
                        {/* Valor */}
                        <span className={`font-bold text-base min-w-[28px] ${isProonto ? "text-emerald-400" : "text-white"}`}>
                          {faixa.valor}
                        </span>

                        {/* Ocorrências */}
                        <span className="text-white/50 text-sm min-w-[50px]">
                          ({faixa.ocorrencias}×)
                        </span>

                        {/* Atraso */}
                        <span className={`text-sm min-w-[60px] ${isProonto ? "text-emerald-400 font-semibold" : "text-white/40"}`}>
                          atraso {faixa.atraso}
                        </span>

                        {/* Badge */}
                        {isProonto && (
                          <span className="text-[10px] bg-emerald-500/25 text-emerald-300 px-2 py-0.5 rounded-full font-semibold ml-auto">
                            🔥 Pronto
                          </span>
                        )}
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
