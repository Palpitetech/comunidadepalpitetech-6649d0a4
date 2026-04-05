import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface GravacaoShellProps {
  children: ReactNode[];
  concurso?: number;
  data?: string;
}

export default function GravacaoShell({ children, concurso, data }: GravacaoShellProps) {
  const [slide, setSlide] = useState(0);
  const total = children.length;
  const navigate = useNavigate();
  const touchStartX = useRef(0);

  const goTo = useCallback(
    (dir: 1 | -1) =>
      setSlide((s) => Math.max(0, Math.min(total - 1, s + dir))),
    [total]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(1);
      if (e.key === "ArrowLeft") goTo(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) goTo(diff > 0 ? 1 : -1);
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden select-none"
      style={{ background: "#0D0B1F", width: "100vw", height: "100vh" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Back arrow */}
      <button
        onClick={() => navigate("/admin")}
        className="absolute top-4 left-4 z-50 text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>

      {/* Top banner */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 text-purple-300/60 text-xs md:text-sm tracking-wide font-medium">
        Palpite Tech — Análise de tendências para Loterias Caixa
      </div>

      {/* Fixed concurso header */}
      {concurso && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 md:gap-3">
          <span
            className="text-lg md:text-2xl font-extrabold tracking-tight"
            style={{
              background: "linear-gradient(135deg, #A78BFA, #7C3AED)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            LOTOFÁCIL
          </span>
          <span className="text-purple-400/60 text-lg md:text-2xl font-light">—</span>
          <span className="text-purple-300 font-bold text-lg md:text-2xl">#{concurso}</span>
          {data && (
            <>
              <span className="text-purple-400/60 text-lg md:text-2xl font-light">—</span>
              <span className="text-white/50 text-sm md:text-base capitalize">{data}</span>
            </>
          )}
        </div>
      )}

      {/* Watermark overlay — anti-screenshot, full page coverage */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ opacity: 0.06, zIndex: 45 }}
      >
        <div
          className="absolute"
          style={{
            width: "300%",
            height: "300%",
            top: "-100%",
            left: "-100%",
            transform: "rotate(-30deg)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, 220px)",
            gridAutoRows: "50px",
            alignItems: "center",
            justifyItems: "center",
          }}
        >
          {Array.from({ length: 200 }, (_, i) => (
            <span
              key={i}
              className="text-white font-bold whitespace-nowrap"
              style={{ fontSize: "16px", letterSpacing: "0.15em" }}
            >
              PALPITE TECH
            </span>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 text-purple-300/40 text-[10px] md:text-xs text-center max-w-xl">
        Recebe estratégias diariamente sem custo no seu WhatsApp pelo link do 1º comentário ou da descrição.
      </div>

      {/* Slide indicator */}
      <div className="absolute bottom-3 right-6 z-50 text-purple-300/50 text-sm font-mono">
        {slide + 1} / {total}
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i === slide ? "bg-purple-500 scale-125" : "bg-white/20"
            }`}
          />
        ))}
      </div>

      {/* Slides track */}
      <div
        className="flex h-full"
        style={{
          transform: `translateX(-${slide * 100}vw)`,
          transition: "transform 0.5s ease",
          width: `${total * 100}vw`,
        }}
      >
        {(children as ReactNode[]).map((child, i) => (
          <div
            key={i}
            className="flex items-center justify-center"
            style={{
              width: "100vw",
              height: "100vh",
              padding: "64px",
              boxSizing: "border-box",
            }}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
