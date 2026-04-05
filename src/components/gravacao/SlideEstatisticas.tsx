import { formatarDezena } from "@/lib/lotofacil";
import type { EstatisticaItem, TendenciaIndicador } from "@/hooks/useGravacaoData";

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

export default function SlideEstatisticas({ dezenas, estatisticas, tendencias }: SlideEstatisticasProps) {
  const sorteadas = new Set(dezenas);

  return (
    <div className="flex w-full h-full gap-6">
      {/* Left 30%: resultado + indicadores do concurso */}
      <div className="w-[30%] flex flex-col items-center justify-center gap-6">
        {/* Mini grid */}
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

        {/* Indicadores do concurso sorteado */}
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

      {/* Right 70%: Tendências para o próximo concurso */}
      <div className="w-[70%] flex flex-col justify-center overflow-hidden">
        <p className="text-white/50 text-sm mb-3 tracking-wide">
          📊 Tendências — Próximo Concurso
        </p>
        <div className="space-y-4 overflow-y-auto max-h-[calc(100%-2rem)] pr-1">
          {tendencias.map((indicador) => (
            <div key={indicador.label}>
              <p className="text-white/70 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                <span>{indicador.emoji}</span>
                {indicador.label}
              </p>
              <div className="grid grid-cols-1 gap-1">
                {indicador.faixas.map((faixa) => (
                  <div
                    key={faixa.valor}
                    className={`
                      flex items-center justify-between rounded-lg px-3 py-1.5 text-xs
                      ${faixa.isDestaque
                        ? "bg-emerald-500/20 border border-emerald-500/40"
                        : "bg-white/5"
                      }
                    `}
                  >
                    {/* Valor principal + complementar */}
                    <div className="flex items-center gap-3 min-w-[90px]">
                      <span className={`font-bold text-sm ${faixa.isDestaque ? "text-emerald-400" : "text-white"}`}>
                        {faixa.valor}
                      </span>
                      <span className="text-white/30">/ {faixa.complementar}</span>
                    </div>

                    {/* Ocorrências (top 3 em parênteses) */}
                    <div className="flex items-center gap-1 min-w-[70px]">
                      <span className="text-white/40 text-[10px]">Ocorr:</span>
                      <span className={`font-semibold ${faixa.isTopOcorrencia ? "text-amber-400" : "text-white/60"}`}>
                        {faixa.isTopOcorrencia ? `(${faixa.ocorrencias})` : faixa.ocorrencias}
                      </span>
                    </div>

                    {/* Atraso */}
                    <div className="flex items-center gap-1 min-w-[70px]">
                      <span className="text-white/40 text-[10px]">Atraso:</span>
                      <span className={`font-semibold ${faixa.isDestaque ? "text-emerald-400" : "text-white/60"}`}>
                        {faixa.atraso}
                      </span>
                    </div>

                    {/* Média */}
                    <div className="flex items-center gap-1 min-w-[60px]">
                      <span className="text-white/40 text-[10px]">Méd:</span>
                      <span className="text-white/50">{faixa.media}</span>
                    </div>

                    {/* Badge destaque */}
                    {faixa.isDestaque && (
                      <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
                        🔥 Pronto
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
