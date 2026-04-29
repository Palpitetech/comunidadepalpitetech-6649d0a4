import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, FileText, Play, BarChart3, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEstudosPosicoesFinaisLista } from "@/hooks/useEstudoPosicoesFinais";

interface EstudoApresentacao {
  slug: string;
  titulo: string;
  descricao: string;
  rota: string;
  cor: string;
  /** Tema_estudo associado — usado para listar versões reais (rascunhos/publicados) */
  tema_estudo?: string;
}

const APRESENTACOES_POR_LOTERIA: Record<string, EstudoApresentacao[]> = {
  megasena: [
    {
      slug: "posicoes-finais",
      titulo: "Posições Finais",
      descricao: "Análise das dezenas mais frequentes nas posições 4, 5 e 6 — sincronizado com o estudo publicado/rascunho.",
      rota: "/admin/gravacao-estudo/megasena/posicoes-finais",
      cor: "#39D353",
      tema_estudo: "analise_posicoes_finais",
    },
  ],
  lotofacil: [],
  quina: [],
};

const LOTERIA_TAG: Record<string, { tag: string; cor: string; nome: string }> = {
  lotofacil: { tag: "Lotofácil", cor: "hsl(270 60% 50%)", nome: "Lotofácil" },
  megasena: { tag: "Mega-Sena", cor: "hsl(125 70% 40%)", nome: "Mega-Sena" },
};

interface Rascunho {
  id: string;
  titulo: string | null;
  conteudo: string;
  tema_estudo: string | null;
  publicar_em: string | null;
  created_at: string;
}

export default function GravacaoEstudos() {
  const { loteria = "lotofacil" } = useParams<{ loteria: string }>();
  const cfg = LOTERIA_TAG[loteria] || LOTERIA_TAG.lotofacil;

  // Lista de estudos reais "Posições Finais" (Mega-Sena) — rascunho + publicado
  const { data: estudosPosFinais } = useEstudosPosicoesFinaisLista(15);

  const { data: rascunhos, isLoading } = useQuery({
    queryKey: ["gravacao-estudos", loteria],
    queryFn: async () => {
      const inicioBRT = new Date();
      inicioBRT.setUTCHours(3, 0, 0, 0);
      if (new Date().getTime() < inicioBRT.getTime()) {
        inicioBRT.setUTCDate(inicioBRT.getUTCDate() - 1);
      }
      const { data, error } = await supabase
        .from("postagens")
        .select("id, titulo, conteudo, tema_estudo, publicar_em, created_at")
        .eq("loteria_tag", cfg.tag)
        .eq("status", "rascunho")
        .gte("created_at", inicioBRT.toISOString())
        .order("publicar_em", { ascending: true });
      if (error) throw error;
      return (data || []) as Rascunho[];
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/admin" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-bold">Gravação Estudos · {cfg.nome}</h1>
          <span className="ml-auto text-xs text-muted-foreground">
            {rascunhos?.length ?? 0} rascunho(s) hoje
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-6">
        {/* Apresentações fullscreen para gravação */}
        {(APRESENTACOES_POR_LOTERIA[loteria] || []).length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4" style={{ color: cfg.cor }} />
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Apresentações para gravação
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {APRESENTACOES_POR_LOTERIA[loteria].map((ap) => (
                <Link
                  key={ap.slug}
                  to={ap.rota}
                  className="group rounded-xl border p-4 hover:shadow-lg transition-all relative overflow-hidden"
                  style={{ borderLeft: `4px solid ${ap.cor}` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                      style={{ background: `${ap.cor}20`, color: ap.cor }}
                    >
                      Fullscreen · 6 slides · Mais recente
                    </span>
                    <div
                      className="rounded-full p-2 group-hover:scale-110 transition-transform"
                      style={{ background: `${ap.cor}15`, color: ap.cor }}
                    >
                      <Play className="h-4 w-4 fill-current" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold mb-1">{ap.titulo}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{ap.descricao}</p>
                </Link>
              ))}
            </div>

            {/* Estudos disponíveis para "Posições Finais" (sincronizados com a comunidade) */}
            {loteria === "megasena" && estudosPosFinais && estudosPosFinais.length > 0 && (
              <div className="mt-4">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                  Posições Finais — escolha um estudo
                </h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {estudosPosFinais.map((e) => {
                    const isRascunho = e.status === "rascunho";
                    return (
                      <Link
                        key={e.id}
                        to={`/admin/gravacao-estudo/megasena/posicoes-finais?postagem=${e.id}`}
                        className="group rounded-lg border p-3 hover:shadow-md hover:border-primary/40 transition-all flex items-center gap-3"
                      >
                        <div
                          className="rounded-full p-2 flex-shrink-0"
                          style={{
                            background: isRascunho ? "rgba(245, 158, 11, 0.12)" : "rgba(57, 211, 83, 0.12)",
                            color: isRascunho ? "#D97706" : "#15803D",
                          }}
                        >
                          {isRascunho ? <FileText className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold">#{e.proximo_concurso ?? "?"}</span>
                            <span
                              className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold"
                              style={{
                                background: isRascunho ? "rgba(245, 158, 11, 0.15)" : "rgba(57, 211, 83, 0.15)",
                                color: isRascunho ? "#D97706" : "#15803D",
                              }}
                            >
                              {isRascunho ? "Rascunho" : "Publicado"}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {e.titulo || "Sem título"}
                          </p>
                        </div>
                        <Play className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary flex-shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Rascunhos do dia */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Rascunhos de hoje
          </h2>
          <div className="space-y-4">
        {isLoading ? (
          <>
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </>
        ) : !rascunhos || rascunhos.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhum rascunho pré-gerado para hoje</p>
            <p className="text-xs mt-1">
              Os rascunhos são gerados automaticamente após o resultado oficial entrar.
            </p>
          </div>
        ) : (
          rascunhos.map((r, idx) => (
            <article
              key={r.id}
              className="rounded-xl border p-5 shadow-sm relative overflow-hidden"
              style={{ borderLeft: `4px solid ${cfg.cor}` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                  style={{ background: `${cfg.cor}20`, color: cfg.cor }}
                >
                  Slide {idx + 1} · {r.tema_estudo || "estudo"}
                </span>
                {r.publicar_em && (
                  <span className="text-[10px] text-muted-foreground">
                    publica em {new Date(r.publicar_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold mb-3">{r.titulo || "Sem título"}</h2>
              <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/90 leading-relaxed">
                {r.conteudo}
              </pre>
            </article>
          ))
        )}
          </div>
        </section>
      </main>
    </div>
  );
}
