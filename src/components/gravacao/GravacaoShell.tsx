import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface GravacaoShellProps {
  children: ReactNode[];
}

export default function GravacaoShell({ children }: GravacaoShellProps) {
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

      {/* Slide indicator */}
      <div className="absolute bottom-4 right-6 z-50 text-purple-300/50 text-sm font-mono">
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
