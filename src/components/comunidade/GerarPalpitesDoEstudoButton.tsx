import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  postId: string;
  tema: string | null;
  loteriaTag: string | null;
}

interface Resultado {
  jogos: number[][];
  baseado_em: { titulo: string; loteria_tag: string; tema: string; proximo_concurso: number };
}

export function GerarPalpitesDoEstudoButton({ postId, tema, loteriaTag }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Resultado | null>(null);
  const [open, setOpen] = useState(false);

  // Só faz sentido em loterias com gerador suportado
  const supported = loteriaTag === "Lotofácil" || loteriaTag === "Mega-Sena";
  if (!supported) return null;

  const gerar = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-palpites-from-estudo", {
        body: { post_id: postId, quantidade: 5 },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setResult(data as Resultado);
      setOpen(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao gerar palpites";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={gerar}
        disabled={loading}
        className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Gerando palpites...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Gerar palpites baseado nesse estudo
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Palpites do estudo
            </DialogTitle>
            <DialogDescription>
              {result && (
                <span>
                  <Badge variant="outline" className="mr-1">{result.baseado_em.loteria_tag}</Badge>
                  Concurso {result.baseado_em.proximo_concurso} · Tema: {result.baseado_em.tema}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {result?.jogos.map((j, i) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                  Jogo {i + 1}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {j.map((d) => (
                    <span
                      key={d}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold"
                    >
                      {d.toString().padStart(2, "0")}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-muted-foreground text-center pt-2">
            Loteria envolve sorte. Palpites informativos.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
