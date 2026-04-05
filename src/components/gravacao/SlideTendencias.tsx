import { formatarDezena } from "@/lib/lotofacil";
import type { GravacaoJogo } from "@/hooks/useGravacaoData";
import { Star, TrendingUp, Snowflake } from "lucide-react";

interface SlideTendenciasProps {
  jogos: GravacaoJogo[];
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

export default function SlideTendencias({ jogos }: SlideTendenciasProps) {
  const ordered = [
    jogos.find((j) => j.tipo === "forca"),
    jogos.find((j) => j.tipo === "recomendado"),
    jogos.find((j) => j.tipo === "oportunidade"),
  ].filter(Boolean) as GravacaoJogo[];

  const STRATEGY_ITEMS = [
    {
      icon: "⭐",
      title: "Recomendado",
      color: "text-emerald-400",
      desc: "Score equilibrado: 30% frequência + 50% timing + 20% tendência. Combina força histórica com oportunidade.",
    },
    {
      icon: "🔼",
      title: "Força Histórica",
      color: "text-blue-400",
      desc: "Prioriza dezenas com maior ocorrência nos últimos 5 concursos. Aposta na continuidade.",
    },
    {
      icon: "❄️",
      title: "Oportunidade",
      color: "text-cyan-400",
      desc: "Foca em dezenas frias com bom timing estatístico. Aposta na reversão de atraso.",
    },
  ];

  return (
    <div className="flex w-full h-full items-center gap-6">
      {/* Left column — Strategy explanation (30%) */}
      <div className="flex flex-col gap-4 justify-center" style={{ width: "30%" }}>
        <p className="text-white/50 text-xs tracking-widest uppercase">Metodologia</p>
        <div className="space-y-4">
          {STRATEGY_ITEMS.map((item) => (
            <div key={item.title} className="space-y-1">
              <p className={`text-sm font-bold ${item.color}`}>
                {item.icon} {item.title}
              </p>
              <p className="text-white/50 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-white/30 text-[10px] mt-2 border-t border-white/10 pt-2">
          Base: últimos 5 concursos da Lotofácil
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

              {/* Grid dezenas */}
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

              {/* Stats */}
              <div className="w-full mt-2 space-y-0.5">
                {statItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between text-[10px] md:text-xs px-1"
                  >
                    <span className="text-white/40">{item.label}</span>
                    <span className="text-white/80 font-semibold">{item.value}</span>
                  </div>
                ))}
                {/* Quentes/Frios */}
                {(s.quentes > 0 || s.frios > 0) && (
                  <div className="flex items-center justify-between text-[10px] md:text-xs px-1 pt-0.5 border-t border-white/10">
                    <span className="text-white/40">🔥 / ❄️</span>
                    <span className="text-white/80 font-semibold">
                      {s.quentes} / {s.frios}
                    </span>
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
