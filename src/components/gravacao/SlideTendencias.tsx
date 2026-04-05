import { formatarDezena } from "@/lib/lotofacil";
import type { GravacaoJogo } from "@/hooks/useGravacaoData";
import { Star, TrendingUp, Snowflake } from "lucide-react";

interface SlideTendenciasProps {
  jogos: GravacaoJogo[];
}

const CARD_CONFIG = {
  recomendado: {
    icon: Star,
    accent: "emerald",
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
    badge: "bg-emerald-500 text-white",
    label: "⭐ Recomendado",
  },
  forca: {
    icon: TrendingUp,
    accent: "blue",
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    badge: "bg-blue-500/80 text-white",
    label: "🔼 Força Histórica",
  },
  oportunidade: {
    icon: Snowflake,
    accent: "cyan",
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/5",
    badge: "bg-cyan-500/80 text-white",
    label: "❄️ Oportunidade",
  },
};

export default function SlideTendencias({ jogos }: SlideTendenciasProps) {
  // Order: forca, recomendado (center), oportunidade
  const ordered = [
    jogos.find((j) => j.tipo === "forca"),
    jogos.find((j) => j.tipo === "recomendado"),
    jogos.find((j) => j.tipo === "oportunidade"),
  ].filter(Boolean) as GravacaoJogo[];

  return (
    <div className="flex flex-col w-full h-full justify-center gap-4">
      <p className="text-white/50 text-sm tracking-wide text-center">
        Tendências — Últimos 5 Concursos
      </p>
      <div className="flex items-stretch gap-4 justify-center">
        {ordered.map((jogo) => {
          const cfg = CARD_CONFIG[jogo.tipo];
          const isMain = jogo.tipo === "recomendado";

          return (
            <div
              key={jogo.tipo}
              className={`
                rounded-2xl border p-5 flex flex-col items-center gap-3
                ${cfg.border} ${cfg.bg}
                ${isMain ? "scale-105 shadow-2xl shadow-emerald-500/10" : ""}
              `}
              style={{ width: isMain ? "36%" : "28%", transition: "transform 0.3s" }}
            >
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${cfg.badge}`}
              >
                {cfg.label}
              </span>
              <div className="grid grid-cols-5 gap-1.5 mt-2">
                {jogo.dezenas.map((d) => (
                  <div
                    key={d}
                    className={`
                      w-9 h-9 md:w-11 md:h-11 rounded-lg flex items-center justify-center
                      text-xs md:text-sm font-bold
                      ${isMain ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/70"}
                    `}
                  >
                    {formatarDezena(d)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
