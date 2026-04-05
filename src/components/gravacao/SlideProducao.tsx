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
            background: "linear-gradient(145deg, #0f0326 0%, #1e0a4a 25%, #3b0f8a 55%, #7c3aed 85%, #a855f7 100%)",
          }}
        >
          {/* Multi-layer glows */}
          <div
            className="absolute"
            style={{
              width: "400px",
              height: "400px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(251,191,36,0.25) 0%, transparent 60%)",
              top: "-120px",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          />
          <div
            className="absolute"
            style={{
              width: "250px",
              height: "250px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)",
              bottom: "-80px",
              left: "-60px",
            }}
          />
          <div
            className="absolute"
            style={{
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)",
              top: "20px",
              right: "-40px",
            }}
          />

          {/* Diagonal stripe accent */}
          <div
            className="absolute"
            style={{
              width: "600px",
              height: "3px",
              background: "linear-gradient(90deg, transparent, rgba(251,191,36,0.3), transparent)",
              top: "85px",
              left: "-50px",
              transform: "rotate(-8deg)",
            }}
          />
          <div
            className="absolute"
            style={{
              width: "600px",
              height: "2px",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
              top: "95px",
              left: "-50px",
              transform: "rotate(-8deg)",
            }}
          />

          {/* Corner badge "RESULTADO" */}
          <div
            className="absolute"
            style={{
              top: "14px",
              left: "16px",
              background: "linear-gradient(135deg, rgba(251,191,36,0.95), rgba(245,158,11,0.95))",
              borderRadius: "6px",
              padding: "3px 10px",
              boxShadow: "0 2px 12px rgba(251,191,36,0.4)",
            }}
          >
            <span style={{ color: "#1a0533", fontSize: "10px", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Resultado Oficial
            </span>
          </div>

          {/* Prize amount — main hero */}
          <div
            className="absolute text-center"
            style={{
              top: "22px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "100%",
            }}
          >
            <p
              style={{
                fontSize: "52px",
                fontWeight: 900,
                lineHeight: 1,
                color: "#fbbf24",
                textShadow: "0 0 30px rgba(251,191,36,0.6), 0 0 60px rgba(251,191,36,0.3), 0 4px 8px rgba(0,0,0,0.5)",
                letterSpacing: "-1px",
              }}
            >
              {premiacao}
            </p>
            <p
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: "10px",
                marginTop: "2px",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Premiação Total
            </p>
          </div>

          {/* LOTOFÁCIL */}
          <p
            className="absolute"
            style={{
              bottom: "58px",
              left: "24px",
              fontSize: "42px",
              lineHeight: 1,
              fontWeight: 900,
              letterSpacing: "-1px",
              color: "#fff",
              textShadow: "0 2px 20px rgba(124,58,237,0.6), 0 4px 8px rgba(0,0,0,0.5)",
            }}
          >
            LOTOFÁCIL
          </p>

          {/* Concurso + Data row */}
          <div
            className="absolute flex items-center gap-3"
            style={{ bottom: "28px", left: "24px" }}
          >
            <span
              style={{
                fontSize: "22px",
                fontWeight: 800,
                background: "linear-gradient(135deg, #c4b5fd, #a78bfa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "none",
              }}
            >
              #{concurso}
            </span>
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", textTransform: "capitalize" }}>
              {data}
            </span>
          </div>

          {/* Badge "3 PALPITES GRÁTIS" */}
          <div
            className="absolute flex items-center gap-1"
            style={{
              bottom: "20px",
              right: "16px",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              borderRadius: "8px",
              padding: "6px 14px",
              boxShadow: "0 4px 20px rgba(34,197,94,0.5), 0 0 30px rgba(34,197,94,0.2)",
            }}
          >
            <span style={{ color: "#fff", fontWeight: 800, fontSize: "13px", letterSpacing: "0.04em" }}>
              3 PALPITES GRÁTIS
            </span>
          </div>

          {/* Emoji accent */}
          <div
            className="absolute"
            style={{
              top: "12px",
              right: "16px",
              fontSize: "28px",
              filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))",
            }}
          >
            🍀
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
