interface Props {
  coluna: number;
  freq: number;
  pct: number;
  max: number;
  destaque?: boolean;
  corDestaque?: string;
}

export default function BarraColunaHorizontal({
  coluna,
  freq,
  pct,
  max,
  destaque = false,
  corDestaque = "#E53935",
}: Props) {
  const pctMax = max > 0 ? (freq / max) * 100 : 0;
  return (
    <div
      className="flex items-center gap-3 rounded-lg px-4 py-1.5"
      style={{
        background:
          "linear-gradient(180deg, rgba(10,40,24,0.92) 0%, rgba(6,28,16,0.92) 100%)",
        border: `2px solid ${destaque ? corDestaque : "rgba(212,175,55,0.55)"}`,
        boxShadow: destaque
          ? `0 0 14px ${corDestaque}55, 0 3px 12px rgba(0,0,0,0.45)`
          : "0 3px 12px rgba(0,0,0,0.45)",
      }}
    >
      <div
        className="flex items-baseline gap-1.5 shrink-0 w-16"
        style={{
          color: "#F5E6B3",
          fontFamily: "'Cinzel', serif",
          textShadow: "0 1px 3px rgba(0,0,0,0.6)",
        }}
      >
        <span className="text-[11px] uppercase tracking-wider opacity-70">C</span>
        <span className="font-extrabold leading-none" style={{ fontSize: 26 }}>
          {coluna}
        </span>
      </div>

      <div
        className="flex-1 h-7 rounded-md relative overflow-hidden"
        style={{
          background: "rgba(0,0,0,0.45)",
          border: "1px solid rgba(212,175,55,0.25)",
        }}
      >
        <div
          className="h-full rounded-md transition-all"
          style={{
            width: `${pctMax}%`,
            background: destaque
              ? `linear-gradient(90deg, ${corDestaque} 0%, #F5C242 100%)`
              : "linear-gradient(90deg, #1f5538 0%, #D4AF37 100%)",
            boxShadow: destaque ? `0 0 10px ${corDestaque}88` : "none",
          }}
        />
      </div>

      <div
        className="shrink-0 text-right tabular-nums"
        style={{
          color: "#F5E6B3",
          fontFamily: "'Cinzel', serif",
          minWidth: 120,
        }}
      >
        <span className="font-extrabold" style={{ fontSize: 22 }}>
          {freq}
        </span>
        <span className="opacity-70 ml-2 text-sm">×</span>
        <span className="opacity-80 ml-2 text-sm">{pct.toFixed(1)}%</span>
      </div>
    </div>
  );
}
