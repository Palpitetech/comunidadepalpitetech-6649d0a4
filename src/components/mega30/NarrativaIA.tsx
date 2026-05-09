import { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { fetchNarrativaMega30 } from "@/lib/mega30/narrativa";
import type { EstudoResultado } from "@/lib/megaEspecialEngine";

interface Props {
  resultado: EstudoResultado | null;
}

export function NarrativaIA({ resultado }: Props) {
  const [texto, setTexto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!resultado || resultado.ranking.length === 0) return;
    setLoading(true);
    setErro(null);
    fetchNarrativaMega30(resultado)
      .then(setTexto)
      .catch((e) => setErro(e?.message ?? "Falha ao gerar análise"))
      .finally(() => setLoading(false));
  }, [resultado?.estudoId, resultado?.periodo.tipo, resultado?.periodo.valor, resultado?.topN]);

  if (!resultado) return null;

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4 mt-4">
      <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        Análise técnica
      </div>
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Gerando análise...
        </div>
      )}
      {erro && <p className="text-sm text-destructive">{erro}</p>}
      {texto && <p className="text-base leading-relaxed text-foreground">{texto}</p>}
    </div>
  );
}
