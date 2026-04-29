import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

interface EstudoShellProps {
  children: ReactNode[];
  backTo?: string;
}

// V2 — Premium Mega-Sena green-neon recording shell
export default function EstudoShell({ children, backTo = "/admin/gravacao/estudos/megasena" }: EstudoShellProps) {
  const [slide, setSlide] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);
  const total = children.length;
  const navigate = useNavigate();
  const touchStartX = useRef(0);
  const cursorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const watermarkRows = Array.from({ length: 16 }, (_, i) => i);
  const watermarkCols = Array.from({ length: 10 }, (_, i) => i);

  const goTo = useCallback(
    (dir: 1 | -1) => setSlide((s) => Math.max(0, Math.min(total - 1, s + dir))),
    [total]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goTo(1);
      }
      if (e.key === "ArrowLeft") goTo(-1);
      if (e.key === "Escape") navigate(backTo);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, navigate, backTo]);

  const resetCursor = useCallback(() => {
    setCursorVisible(true);
    if (cursorTimer.current) clearTimeout(cursorTimer.current);
    cursorTimer.current = setTimeout(() => setCursorVisible(false), 3000);
  }, []);

  useEffect(() => {
    resetCursor();
    return () => {
      if (cursorTimer.current) clearTimeout(cursorTimer.current);
    };
  }, [resetCursor]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) goTo(diff > 0 ? 1 : -1);
  };

  const progress = ((slide + 1) / total) * 100;

  return (
    <div
      className="fixed inset-0 overflow-hidden select-none"
      style={{
        background:
          "radial-gradient(1200px 600px at 50% 0%, rgba(125, 255, 58, 0.06), transparent 70%), radial-gradient(900px 500px at 80% 100%, rgba(57, 211, 83, 0.05), transparent 70%), #050805",
        width: "100vw",
        height: "100vh",
        cursor: cursorVisible ? "default" : "none",
      }}
      onMouseMove={resetCursor}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.07]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgba(125, 255, 58, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(125, 255, 58, 0.5) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 80%)",
        }}
      />

      {/* Top progress bar */}
      <div className="absolute top-0 left-0 right-0 z-50 h-[3px] bg-white/[0.04]">
        <div
          className="h-full"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, #39D353, #7DFF3A, #B7FF8A)",
            boxShadow: "0 0 18px rgba(125, 255, 58, 0.85), 0 0 4px rgba(183, 255, 138, 1)",
            transition: "width 0.6s cubic-bezier(0.65, 0, 0.35, 1)",
          }}
        />
      </div>

      {/* Back arrow */}
      <button
        onClick={() => navigate(backTo)}
        className="absolute top-4 left-4 z-50 text-[#7DFF3A]/40 hover:text-[#B7FF8A] transition-colors p-2"
        aria-label="Voltar"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>

      {/* Watermark */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 flex min-h-[180vh] w-[180vw] -translate-x-1/2 -translate-y-1/2 -rotate-[28deg] flex-col justify-center gap-8">
          {watermarkRows.map((r) => (
            <div
              key={r}
              className={`flex gap-8 whitespace-nowrap ${r % 2 === 0 ? "-translate-x-12" : "translate-x-6"}`}
            >
              {watermarkCols.map((c) => (
                <span
                  key={`${r}-${c}`}
                  className="text-sm font-black tracking-[0.45em] md:text-base"
                  style={{ color: "rgba(125, 255, 58, 0.025)" }}
                >
                  PALPITE TECH
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Side navigation */}
      {slide > 0 && (
        <button
          onClick={() => goTo(-1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-[#7DFF3A]/[0.04] hover:bg-[#7DFF3A]/15 text-[#7DFF3A]/50 hover:text-[#B7FF8A] transition-all border border-[#7DFF3A]/15"
          aria-label="Slide anterior"
        >
          <ChevronLeft className="h-7 w-7" />
        </button>
      )}
      {slide < total - 1 && (
        <button
          onClick={() => goTo(1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-[#7DFF3A]/[0.04] hover:bg-[#7DFF3A]/15 text-[#7DFF3A]/50 hover:text-[#B7FF8A] transition-all border border-[#7DFF3A]/15"
          aria-label="Próximo slide"
        >
          <ChevronRight className="h-7 w-7" />
        </button>
      )}

      {/* Slide indicator */}
      <div className="absolute bottom-4 right-6 z-50 font-mono tracking-[0.25em] text-xs" style={{ color: "rgba(125, 255, 58, 0.5)" }}>
        {String(slide + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-50 flex gap-2">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: i === slide ? 36 : 6,
              background: i === slide ? "#7DFF3A" : "rgba(125, 255, 58, 0.18)",
              boxShadow: i === slide ? "0 0 12px rgba(125, 255, 58, 0.8)" : "none",
            }}
          />
        ))}
      </div>

      {/* Slides track */}
      <div
        className="flex h-full relative z-20"
        style={{
          transform: `translateX(-${slide * 100}vw)`,
          transition: "transform 0.6s cubic-bezier(0.65, 0, 0.35, 1)",
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
              padding: "80px",
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
