import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import background from "@/assets/gravacao/megasena-30anos/background.jpg";

interface Mega30ShellProps {
  children: ReactNode[];
  /** índices que devem renderizar SEM background (capas full-bleed) */
  capaIndices?: number[];
}

export default function Mega30Shell({ children, capaIndices = [0] }: Mega30ShellProps) {
  const [slide, setSlide] = useState(0);
  const total = children.length;
  const navigate = useNavigate();
  const touchStartX = useRef(0);
  const capaSet = new Set(capaIndices);

  const goTo = useCallback(
    (dir: 1 | -1) => setSlide((s) => Math.max(0, Math.min(total - 1, s + dir))),
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

  const isCapa = capaSet.has(slide);

  return (
    <div
      className="fixed inset-0 overflow-hidden select-none"
      style={{ background: "#0A2818", width: "100vw", height: "100vh" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button
        onClick={() => navigate("/admin")}
        className="absolute top-4 left-4 z-50 text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>

      {!isCapa && (
        <div
          className="absolute bottom-3 right-6 z-50 text-[10px] font-mono"
          style={{ color: "rgba(212,175,55,0.55)" }}
        >
          {slide + 1} / {total}
        </div>
      )}

      <div
        className="flex h-full"
        style={{
          transform: `translateX(-${slide * 100}vw)`,
          transition: "transform 0.5s ease",
          width: `${total * 100}vw`,
        }}
      >
        {(children as ReactNode[]).map((child, i) => {
          const capa = capaSet.has(i);
          return (
            <div
              key={i}
              className="relative flex items-stretch justify-stretch"
              style={{
                width: "100vw",
                height: "100vh",
                backgroundImage: capa ? undefined : `url(${background})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {/* overlay sutil para legibilidade nos slides com background */}
              {!capa && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(10,40,24,0.35) 0%, rgba(10,40,24,0.15) 50%, rgba(10,40,24,0.55) 100%)",
                  }}
                />
              )}
              <div className="relative z-10 w-full h-full">{child}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
