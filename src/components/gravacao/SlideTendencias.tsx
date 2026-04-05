import { formatarDezena } from "@/lib/lotofacil";
import type { GravacaoJogo, EstrategiaIA } from "@/hooks/useGravacaoData";

interface SlideTendenciasProps {
  jogos: GravacaoJogo[];
  estrategiaIA?: EstrategiaIA;
}

const CARD_CONFIG = {
  recomendado: {
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
    badge: "bg-emerald-500 text-white",
    label: "⭐ Recomendado",
    numBg: "bg-emerald-500/20 text-emerald-300",
  },
  forca: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    badge: "bg-blue-500/80 text-white",
    label: "🔼 Força Histórica",
    numBg: "bg-white/10 text-white/70",
  },
  oportunidade: {
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/5",
    badge: "bg-cyan-500/80 text-white",
    label: "❄️ Oportunidade",
    numBg: "bg-white/10 text-white/70",
  },
};

const pad = (d: number) => d.toString().padStart(2, "0");

export default function SlideTendencias({ jogos, estrategiaIA }: SlideTendenciasProps) {
  const ordered = [
    jogos.find((j) => j.tipo === "forca"),
    jogos.find((j) => j.tipo === "recomendado"),
    jogos.find((j) => j.tipo === "oportunidade"),
  ].filter(Boolean) as GravacaoJogo[];

  return (
    <div className="flex w-full h-full items-center gap-6">
      {/* Left column — Strategy (30%) */}
      <div className="flex flex-col gap-3 justify-center overflow-hidden" style={{ width: "30%" }}>
        <p className="text-white/50 text-xs tracking-widest uppercase">Estratégia da IA</p>

        {estrategiaIA ? (
          <div className="space-y-3">
            {/* Conclusão */}
            {estrategiaIA.conclusao && (
              <p className="text-white/70 text-xs leading-relaxed italic border-l-2 border-emerald-500/40 pl-3">
                {estrategiaIA.conclusao}
              </p>
            )}

            {/* Ferramentas */}
            {estrategiaIA.ferramentas.length > 0 && (
              <div className="space-y-1">
                <p className="text-white/40 text-[10px] uppercase tracking-wider">🔧 Ferramentas</p>
                <div className="flex flex-wrap gap-1">
                  {estrategiaIA.ferramentas.map((f, i) => (
                    <span key={i} className="text-[10px] bg-white/5 text-white/60 px-2 py-0.5 rounded-full border border-white/10">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Dezenas Priorizadas */}
            {estrategiaIA.dezenas_fixas.length > 0 && (
              <div className="space-y-1">
                <p className="text-white/40 text-[10px] uppercase tracking-wider">✅ Priorizadas</p>
                {estrategiaIA.dezenas_fixas.slice(0, 3).map((item, i) => (
                  <div key={i} className="text-[10px] leading-relaxed">
                    <span className="text-emerald-400 font-semibold">{item.dezenas.map(pad).join(", ")}</span>
                    <span className="text-white/40"> — {item.motivo}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Dezenas Evitadas */}
            {estrategiaIA.dezenas_evitadas.length > 0 && (
              <div className="space-y-1">
                <p className="text-white/40 text-[10px] uppercase tracking-wider">❌ Evitadas</p>
                {estrategiaIA.dezenas_evitadas.slice(0, 3).map((item, i) => (
                  <div key={i} className="text-[10px] leading-relaxed">
                    <span className="text-red-400 font-semibold">{item.dezenas.map(pad).join(", ")}</span>
                    <span className="text-white/40"> — {item.motivo}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Filtros Aplicados */}
            {estrategiaIA.filtros_aplicados.length > 0 && (
              <div className="space-y-1">
                <p className="text-white/40 text-[10px] uppercase tracking-wider">🎯 Filtros</p>
                {estrategiaIA.filtros_aplicados.slice(0, 4).map((f, i) => (
                  <div key={i} className="text-[10px] leading-relaxed">
                    <span className="text-white/60 font-semibold">{f.filtro}</span>
                    {f.valor_alvo && <span className="text-white/40"> → {f.valor_alvo}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-white/40 text-xs">Carregando estratégia...</p>
        )}

        <p className="text-white/30 text-[10px] mt-1 border-t border-white/10 pt-2">
          Gerado por IA • Últimos 5 concursos
        </p>
      </div>

      {/* Right column — Cards (70%) */}
      <div className="flex items-stretch gap-4 justify-center" style={{ width: "70%" }}>
        {ordered.map((jogo) => {
          const cfg = CARD_CONFIG[jogo.tipo];
          const isMain = jogo.tipo === "recomendado";
          const s = jogo.stats;

          const statItems = [
            { label: "Pares", value: s.pares },
            { label: "Ímpares", value: s.impares },
            { label: "Primos", value: s.primos },
            { label: "Moldura", value: s.moldura },
            { label: "Repetidas", value: s.repetidas },
            { label: "Soma", value: s.soma },
          ];

          return (
            <div
              key={jogo.tipo}
              className={`
                rounded-2xl border p-4 flex flex-col items-center gap-2
                ${cfg.border} ${cfg.bg}
                ${isMain ? "scale-105 shadow-2xl shadow-emerald-500/10" : ""}
              `}
              style={{ width: isMain ? "36%" : "28%", transition: "transform 0.3s" }}
            >
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${cfg.badge}`}>
                {cfg.label}
              </span>

              <div className="grid grid-cols-5 gap-1 mt-1">
                {jogo.dezenas.map((d) => (
                  <div
                    key={d}
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-xs md:text-sm font-bold ${cfg.numBg}`}
                  >
                    {formatarDezena(d)}
                  </div>
                ))}
              </div>

              <div className="w-full mt-2 space-y-0.5">
                {statItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-[10px] md:text-xs px-1">
                    <span className="text-white/40">{item.label}</span>
                    <span className="text-white/80 font-semibold">{item.value}</span>
                  </div>
                ))}
                {(s.quentes > 0 || s.frios > 0) && (
                  <div className="flex items-center justify-between text-[10px] md:text-xs px-1 pt-0.5 border-t border-white/10">
                    <span className="text-white/40">🔥 / ❄️</span>
                    <span className="text-white/80 font-semibold">{s.quentes} / {s.frios}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
