import { useRef, useState } from "react";
import { Copy, Check, Download } from "lucide-react";
import html2canvas from "html2canvas";

interface SlideProducaoProps {
  concurso: number;
  data: string;
  premiacao: string;
}

export default function SlideProducao({ concurso, data, premiacao }: SlideProducaoProps) {
  const thumbRef = useRef<HTMLDivElement>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const titulo = `Resultado e Análise Lotofácil #${concurso} - 3 Palpites grátis`;

  const descricao = `🍀 Resultado Lotofácil Concurso ${concurso} | Análise Completa + 3 Palpites Grátis

📊 Confira o resultado do concurso ${concurso} da Lotofácil sorteado em ${data}. Premiação total de ${premiacao}!

Neste vídeo você encontra:
✅ Resultado oficial da Lotofácil ${concurso}
✅ Análise estatística completa (pares, ímpares, primos, moldura, soma)
✅ Frequência das dezenas nos últimos concursos
✅ Tendências e padrões identificados
✅ 3 palpites gerados por inteligência artificial

🔔 Ative o sininho para não perder nenhum resultado!
📲 Receba estratégias grátis no WhatsApp pelo link do 1º comentário.

#lotofacil #lotofácil #resultado #loteria #concurso${concurso} #palpites #loterias #caixa #megasena #sorteio #resultadolotofacil #lotofacilhoje #lotofacilconcurso${concurso}`;

  const copiar = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const baixarThumb = async () => {
    if (!thumbRef.current) return;
    const canvas = await html2canvas(thumbRef.current, {
      scale: 2,
      backgroundColor: null,
      useCORS: true,
    });
    const link = document.createElement("a");
    link.download = `thumb-lotofacil-${concurso}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="flex w-full h-full gap-6 items-start overflow-y-auto" style={{ maxWidth: "1200px" }}>
      {/* Left: Title + Description */}
      <div className="flex-1 space-y-5 min-w-0">
        {/* Title */}
        <div>
          <label className="text-purple-400 text-xs uppercase tracking-wider font-semibold mb-1 block">
            Título do Vídeo
          </label>
          <div
            className="rounded-xl px-4 py-3 flex items-start gap-3 cursor-pointer group"
            style={{
              background: "rgba(124, 58, 237, 0.1)",
              border: "1px solid rgba(124, 58, 237, 0.25)",
            }}
            onClick={() => copiar(titulo, "titulo")}
          >
            <p className="text-white text-sm md:text-base font-medium flex-1 select-all">
              {titulo}
            </p>
            {copiedField === "titulo" ? (
              <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
            ) : (
              <Copy className="h-4 w-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-purple-400 text-xs uppercase tracking-wider font-semibold mb-1 block">
            Descrição (SEO)
          </label>
          <div
            className="rounded-xl px-4 py-3 flex items-start gap-3 cursor-pointer group"
            style={{
              background: "rgba(124, 58, 237, 0.1)",
              border: "1px solid rgba(124, 58, 237, 0.25)",
            }}
            onClick={() => copiar(descricao, "descricao")}
          >
            <pre className="text-white/80 text-xs md:text-sm flex-1 whitespace-pre-wrap font-sans select-all leading-relaxed">
              {descricao}
            </pre>
            {copiedField === "descricao" ? (
              <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
            ) : (
              <Copy className="h-4 w-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
            )}
          </div>
        </div>
      </div>

      {/* Right: Thumbnail preview + download */}
      <div className="flex flex-col items-center gap-3 shrink-0">
        <label className="text-purple-400 text-xs uppercase tracking-wider font-semibold">
          Thumbnail
        </label>

        {/* Thumbnail */}
        <div
          ref={thumbRef}
          className="relative overflow-hidden"
          style={{
            width: "480px",
            height: "270px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #1a0533 0%, #2d1065 30%, #7c3aed 60%, #a855f7 100%)",
          }}
        >
          {/* Glow circle */}
          <div
            className="absolute"
            style={{
              width: "300px",
              height: "300px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)",
              top: "-60px",
              right: "-40px",
            }}
          />

          {/* Prize amount — hero */}
          <div
            className="absolute text-center"
            style={{
              top: "30px",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <p
              className="text-4xl md:text-5xl font-black tracking-tight leading-none"
              style={{
                color: "#fbbf24",
                textShadow: "0 2px 20px rgba(251,191,36,0.5), 0 0 40px rgba(251,191,36,0.3)",
              }}
            >
              {premiacao}
            </p>
            <p className="text-white/70 text-xs mt-1 tracking-wider uppercase">Premiação Total</p>
          </div>

          {/* LOTOFÁCIL */}
          <p
            className="absolute font-black tracking-tight"
            style={{
              bottom: "55px",
              left: "24px",
              fontSize: "36px",
              lineHeight: 1,
              color: "#fff",
              textShadow: "0 2px 10px rgba(0,0,0,0.5)",
            }}
          >
            LOTOFÁCIL
          </p>

          {/* Concurso + Data */}
          <div
            className="absolute flex items-center gap-3"
            style={{ bottom: "24px", left: "24px" }}
          >
            <span
              className="font-bold text-lg"
              style={{
                color: "#c4b5fd",
                textShadow: "0 1px 6px rgba(0,0,0,0.4)",
              }}
            >
              #{concurso}
            </span>
            <span className="text-white/50 text-sm capitalize">{data}</span>
          </div>

          {/* Badge "3 PALPITES GRÁTIS" */}
          <div
            className="absolute flex items-center gap-1 px-3 py-1.5 rounded-lg"
            style={{
              bottom: "24px",
              right: "16px",
              background: "rgba(34,197,94,0.9)",
              boxShadow: "0 2px 12px rgba(34,197,94,0.4)",
            }}
          >
            <span className="text-white font-extrabold text-xs tracking-wide">
              3 PALPITES GRÁTIS
            </span>
          </div>

          {/* Corner accent */}
          <div
            className="absolute"
            style={{
              top: "12px",
              left: "16px",
              background: "rgba(255,255,255,0.15)",
              borderRadius: "6px",
              padding: "4px 10px",
            }}
          >
            <span className="text-white/80 text-[10px] font-semibold tracking-wider uppercase">
              Resultado Oficial
            </span>
          </div>
        </div>

        <button
          onClick={baixarThumb}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            color: "#fff",
            boxShadow: "0 4px 14px rgba(124,58,237,0.4)",
          }}
        >
          <Download className="h-4 w-4" />
          Baixar Thumbnail
        </button>
      </div>
    </div>
  );
}
