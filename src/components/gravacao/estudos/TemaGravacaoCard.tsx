import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, FileText, CheckCircle2, ChevronDown, Clock, Lock } from "lucide-react";
import type { TemaGravacao } from "./temasConfig";
import {
  useEstudosGravacaoLista,
  type EstudoListItem,
} from "@/hooks/useEstudosGravacaoLista";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  tema: TemaGravacao;
  loteriaTag: string;
}

const VISIVEL_INICIAL = 6;

function fmtData(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const hoje = new Date();
  const diff = (hoje.getTime() - d.getTime()) / 86_400_000;
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (diff < 1 && d.getDate() === hoje.getDate()) return `Hoje ${hora}`;
  if (diff < 2) return `Ontem ${hora}`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " " + hora;
}

export default function TemaGravacaoCard({ tema, loteriaTag }: Props) {
  const [expandido, setExpandido] = useState(false);
  const ehAtivo = tema.status === "ativo";

  const { data: estudos, isLoading } = useEstudosGravacaoLista({
    loteriaTag,
    temaEstudo: tema.tema_estudo,
    limit: 30,
    enabled: ehAtivo,
  });

  const lista = estudos || [];
  const visiveis = expandido ? lista : lista.slice(0, VISIVEL_INICIAL);
  const restantes = lista.length - VISIVEL_INICIAL;

  return (
    <article
      className="rounded-xl border bg-card overflow-hidden"
      style={{ borderLeft: `4px solid ${tema.cor}` }}
    >
      {/* Cabeçalho do tema */}
      <header className="px-5 py-4 border-b bg-muted/30">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-bold">{tema.titulo}</h2>
              {!ehAtivo && (
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold bg-muted text-muted-foreground flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" /> Em breve
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {tema.descricao}
            </p>
          </div>
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded whitespace-nowrap"
            style={{ background: `${tema.cor}20`, color: tema.cor }}
          >
            Fullscreen · {tema.totalSlides} slides
          </span>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="p-4">
        {!ehAtivo ? (
          <div className="text-xs text-muted-foreground text-center py-6">
            Tema ainda não disponível para gravação.
          </div>
        ) : isLoading ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : lista.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
            <Clock className="h-6 w-6 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-medium">Aguardando rascunho do dia</p>
            <p className="text-[11px] mt-1">
              Estudos são gerados automaticamente após o resultado oficial.
            </p>
          </div>
        ) : (
          <>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-bold">
              Versões disponíveis · mais recentes primeiro
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {visiveis.map((e) => (
                <EstudoCard key={e.id} estudo={e} tema={tema} />
              ))}
            </div>

            {restantes > 0 && (
              <button
                onClick={() => setExpandido((v) => !v)}
                className="mt-3 w-full text-xs font-medium text-muted-foreground hover:text-foreground py-2 rounded-lg border border-dashed flex items-center justify-center gap-1.5 transition-colors"
              >
                {expandido ? "Mostrar menos" : `Ver todos os ${lista.length} estudos`}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${expandido ? "rotate-180" : ""}`}
                />
              </button>
            )}
          </>
        )}
      </div>
    </article>
  );
}

function EstudoCard({
  estudo,
  tema,
}: {
  estudo: EstudoListItem;
  tema: TemaGravacao;
}) {
  const isRascunho = estudo.status === "rascunho";
  return (
    <Link
      to={`${tema.rotaBase}?postagem=${estudo.id}`}
      className="group rounded-lg border bg-background p-3 hover:shadow-md hover:border-primary/40 transition-all flex items-center gap-3"
    >
      <div
        className="rounded-full p-2 flex-shrink-0"
        style={{
          background: isRascunho ? "rgba(245, 158, 11, 0.12)" : `${tema.cor}1F`,
          color: isRascunho ? "#D97706" : tema.cor,
        }}
      >
        {isRascunho ? (
          <FileText className="h-4 w-4" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-bold">
            #{estudo.proximo_concurso ?? "?"}
          </span>
          <span
            className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold"
            style={{
              background: isRascunho
                ? "rgba(245, 158, 11, 0.15)"
                : `${tema.cor}26`,
              color: isRascunho ? "#D97706" : tema.cor,
            }}
          >
            {isRascunho ? "Rascunho" : "Publicado"}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {fmtData(estudo.publicar_em ?? estudo.created_at)}
        </p>
      </div>
      <Play className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary flex-shrink-0" />
    </Link>
  );
}
