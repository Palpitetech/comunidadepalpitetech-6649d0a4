import { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, FileText, CheckCircle2 } from "lucide-react";
import type { EstudoListItem } from "@/hooks/useEstudoPosicoesFinais";

interface Props {
  estudos: EstudoListItem[];
  selecionadoId: string | undefined;
  onChange: (id: string) => void;
}

function fmtData(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SeletorEstudo({ estudos, selecionadoId, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const atual = estudos.find((e) => e.id === selecionadoId) ?? estudos[0];

  return (
    <div ref={ref} className="absolute top-3 right-16 z-[60]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{
          background: "rgba(125, 255, 58, 0.12)",
          border: "1px solid rgba(125, 255, 58, 0.35)",
          color: "#B7FF8A",
        }}
      >
        <span className="text-white/40">Estudo</span>
        <span className="text-white font-bold">
          #{atual?.proximo_concurso ?? "—"}
        </span>
        {atual?.status === "rascunho" ? (
          <span
            className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold"
            style={{ background: "rgba(245, 158, 11, 0.15)", color: "#FCD34D" }}
          >
            Rascunho
          </span>
        ) : (
          <span
            className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold"
            style={{ background: "rgba(125, 255, 58, 0.18)", color: "#7DFF3A" }}
          >
            Publicado
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-xl shadow-2xl overflow-hidden"
          style={{
            background: "#070C08",
            border: "1px solid rgba(125, 255, 58, 0.25)",
            maxHeight: "70vh",
          }}
        >
          <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-white/40 border-b border-white/5">
            Selecione o estudo (rascunho ou publicado)
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: "calc(70vh - 36px)" }}>
            {estudos.length === 0 && (
              <div className="px-3 py-6 text-xs text-white/40 text-center">
                Nenhum estudo de Posições Finais encontrado.
              </div>
            )}
            {estudos.map((e) => {
              const ativo = e.id === atual?.id;
              const isRascunho = e.status === "rascunho";
              return (
                <button
                  key={e.id}
                  onClick={() => {
                    onChange(e.id);
                    setOpen(false);
                  }}
                  className="w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-white/5 transition-colors"
                  style={{
                    background: ativo ? "rgba(125, 255, 58, 0.12)" : undefined,
                  }}
                >
                  <div className="mt-0.5">
                    {isRascunho ? (
                      <FileText className="h-4 w-4 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-[#7DFF3A]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-bold ${ativo ? "text-[#B7FF8A]" : "text-white/90"}`}
                      >
                        #{e.proximo_concurso ?? "?"}
                      </span>
                      <span
                        className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold"
                        style={{
                          background: isRascunho
                            ? "rgba(245, 158, 11, 0.15)"
                            : "rgba(125, 255, 58, 0.15)",
                          color: isRascunho ? "#FCD34D" : "#7DFF3A",
                        }}
                      >
                        {isRascunho ? "Rascunho" : "Publicado"}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/55 truncate">
                      {e.titulo || "Sem título"}
                    </p>
                    <p className="text-[10px] text-white/35 mt-0.5">
                      {fmtData(e.publicar_em ?? e.created_at)}
                    </p>
                  </div>
                  {ativo && <Check className="h-4 w-4 text-[#7DFF3A] mt-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
