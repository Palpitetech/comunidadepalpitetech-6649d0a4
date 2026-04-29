import { useState, useEffect, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";

interface ConcursoOption {
  concurso: number;
  data_sorteio: string | null;
}

interface Props {
  concursos: ConcursoOption[];
  selecionado: number | undefined;
  onChange: (c: number) => void;
}

export default function SeletorConcurso({ concursos, selecionado, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const atual = concursos.find((c) => c.concurso === selecionado);

  return (
    <div ref={ref} className="absolute top-3 right-16 z-[60]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{
          background: "rgba(124, 58, 237, 0.12)",
          border: "1px solid rgba(124, 58, 237, 0.3)",
          color: "#C4B5FD",
        }}
      >
        <span className="text-white/40">Concurso</span>
        <span className="text-white font-bold">#{atual?.concurso ?? "—"}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-xl shadow-2xl overflow-hidden"
          style={{
            background: "#0F172A",
            border: "1px solid #1F2937",
            maxHeight: "60vh",
          }}
        >
          <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-white/40 border-b border-white/5">
            Selecione o concurso de referência
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: "calc(60vh - 36px)" }}>
            {concursos.map((c) => {
              const ativo = c.concurso === selecionado;
              const dataLabel = c.data_sorteio
                ? new Date(c.data_sorteio + "T00:00:00").toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "";
              return (
                <button
                  key={c.concurso}
                  onClick={() => {
                    onChange(c.concurso);
                    setOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white/5 transition-colors"
                  style={{
                    background: ativo ? "rgba(124, 58, 237, 0.15)" : undefined,
                  }}
                >
                  <div className="flex flex-col">
                    <span className={`text-sm font-bold ${ativo ? "text-purple-200" : "text-white/85"}`}>
                      #{c.concurso}
                    </span>
                    {dataLabel && <span className="text-[11px] text-white/40">{dataLabel}</span>}
                  </div>
                  {ativo && <Check className="h-4 w-4 text-purple-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
