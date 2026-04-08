import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface SlideProducaoQuinaProps {
  concurso: number;
  data: string;
  premiacao: string;
}

export default function SlideProducaoQuina({ concurso, data, premiacao }: SlideProducaoQuinaProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const titulo = `RESULTADO QUINA HOJE #${concurso} (${data}) | Palpites Grátis`;

  const descricao = `🍀 Resultado Quina Concurso ${concurso} | Análise Completa + 3 Palpites Grátis

📊 Confira o resultado do concurso ${concurso} da Quina sorteado em ${data}. Premiação total de ${premiacao}!

Neste vídeo você encontra:
✅ Resultado oficial da Quina ${concurso}
✅ Análise estatística completa (pares, ímpares, primos, moldura, soma)
✅ Frequência das dezenas nos últimos concursos
✅ Tendências e padrões identificados
✅ 3 palpites estratégicos para o próximo concurso

🔔 Ative o sininho para não perder nenhum resultado!
📲 Receba estratégias grátis no WhatsApp pelo link do 1º comentário.

#quina #resultado #loteria #concurso${concurso} #palpites #loterias #caixa #megasena #sorteio #resultadoquina #quinahoje #quinaconcurso${concurso}`;

  const copiar = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="flex flex-col w-full h-full gap-5 overflow-y-auto" style={{ maxWidth: "800px" }}>
      {/* Title */}
      <div>
        <label className="text-indigo-400 text-xs uppercase tracking-wider font-semibold mb-1 block">
          Título do Vídeo
        </label>
        <div
          className="rounded-xl px-4 py-3 flex items-start gap-3 cursor-pointer group"
          style={{
            background: "rgba(99, 102, 241, 0.1)",
            border: "1px solid rgba(99, 102, 241, 0.25)",
          }}
          onClick={() => copiar(titulo, "titulo")}
        >
          <p className="text-white text-sm md:text-base font-medium flex-1 select-all">
            {titulo}
          </p>
          {copiedField === "titulo" ? (
            <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
          ) : (
            <Copy className="h-4 w-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-indigo-400 text-xs uppercase tracking-wider font-semibold mb-1 block">
          Descrição (SEO)
        </label>
        <div
          className="rounded-xl px-4 py-3 flex items-start gap-3 cursor-pointer group"
          style={{
            background: "rgba(99, 102, 241, 0.1)",
            border: "1px solid rgba(99, 102, 241, 0.25)",
          }}
          onClick={() => copiar(descricao, "descricao")}
        >
          <pre className="text-white/80 text-xs md:text-sm flex-1 whitespace-pre-wrap font-sans select-all leading-relaxed">
            {descricao}
          </pre>
          {copiedField === "descricao" ? (
            <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
          ) : (
            <Copy className="h-4 w-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
          )}
        </div>
      </div>
    </div>
  );
}
