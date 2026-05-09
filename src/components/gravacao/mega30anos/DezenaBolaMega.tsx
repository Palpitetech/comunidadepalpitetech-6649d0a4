interface Props {
  numero: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  freq?: number;
}

const SIZES: Record<NonNullable<Props["size"]>, { box: string; num: string; freq: string }> = {
  xs: { box: "w-8 h-8", num: "text-[11px]", freq: "text-[8px]" },
  sm: { box: "w-10 h-10", num: "text-sm", freq: "text-[9px]" },
  md: { box: "w-14 h-14", num: "text-lg", freq: "text-[10px]" },
  lg: { box: "w-20 h-20", num: "text-2xl", freq: "text-xs" },
  xl: { box: "w-28 h-28", num: "text-4xl", freq: "text-sm" },
};

export default function DezenaBolaMega({ numero, size = "md", freq }: Props) {
  const s = SIZES[size];
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${s.box} rounded-full flex items-center justify-center font-extrabold relative`}
        style={{
          background:
            "radial-gradient(circle at 30% 25%, #1f5538 0%, #0d3220 55%, #061b11 100%)",
          border: "1.5px solid rgba(212,175,55,0.7)",
          boxShadow:
            "inset 0 -4px 8px rgba(0,0,0,0.5), inset 0 3px 6px rgba(212,175,55,0.15), 0 4px 10px rgba(0,0,0,0.45)",
          fontFamily: "'Cinzel', serif",
        }}
      >
        <span
          className={s.num}
          style={{
            color: "#E8C766",
            textShadow: "0 1px 2px rgba(0,0,0,0.7), 0 0 8px rgba(212,175,55,0.25)",
          }}
        >
          {String(numero).padStart(2, "0")}
        </span>
      </div>
      {freq !== undefined && (
        <span className={`${s.freq} text-[#D4AF37]/75 font-semibold tabular-nums`}>
          {freq}×
        </span>
      )}
    </div>
  );
}
