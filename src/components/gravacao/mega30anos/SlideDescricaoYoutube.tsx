import { useState } from "react";
import { Copy, RefreshCw, Check, Loader2 } from "lucide-react";
import { useMega30AulaDescricao, type SlideMeta } from "@/hooks/useMega30AulaDescricao";

interface Props {
  aulaId: string;
  aulaTitulo: string;
  slides: SlideMeta[];
}

export default function SlideDescricaoYoutube({ aulaId, aulaTitulo, slides }: Props) {
  const { descricao, loading, erro, regenerar, generatedAt } = useMega30AulaDescricao(
    aulaId,
    aulaTitulo,
    slides,
  );
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    if (!descricao) return;
    await navigator.clipboard.writeText(descricao);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-start px-6 sm:px-12 py-8 overflow-hidden">
      <h2
        className="text-2xl sm:text-4xl font-bold mb-4 text-center"
        style={{ color: "#D4AF37", fontFamily: "Cinzel, serif" }}
      >
        Descrição para YouTube
      </h2>

      <div className="flex gap-2 mb-4">
        <button
          onClick={copiar}
          disabled={!descricao || loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition disabled:opacity-50"
          style={{ background: "#D4AF37", color: "#0A2818" }}
        >
          {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copiado ? "Copiado!" : "Copiar tudo"}
        </button>
        <button
          onClick={regenerar}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm border transition disabled:opacity-50"
          style={{ borderColor: "#D4AF37", color: "#D4AF37" }}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Regerar
        </button>
      </div>

      <div
        className="w-full max-w-3xl flex-1 overflow-y-auto rounded-xl p-5 text-sm sm:text-base leading-relaxed whitespace-pre-wrap"
        style={{
          background: "rgba(0,0,0,0.4)",
          color: "#F5E6B3",
          border: "1px solid rgba(212,175,55,0.3)",
          fontFamily: "ui-sans-serif, system-ui",
        }}
      >
        {loading && !descricao && (
          <div className="flex items-center justify-center gap-2 py-10">
            <Loader2 className="h-5 w-5 animate-spin" />
            Gerando descrição com base nos dados dos slides...
          </div>
        )}
        {erro && <p style={{ color: "#FCA5A5" }}>Erro: {erro}</p>}
        {descricao && descricao}
      </div>

      {generatedAt && (
        <p className="text-[10px] mt-2" style={{ color: "rgba(212,175,55,0.5)" }}>
          Gerado em {new Date(generatedAt).toLocaleString("pt-BR")}
        </p>
      )}
    </div>
  );
}
